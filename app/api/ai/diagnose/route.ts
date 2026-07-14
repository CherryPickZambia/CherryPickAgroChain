import { NextRequest, NextResponse } from 'next/server';

const CROP_ANALYSIS_PROMPT = `You are an expert agronomist, plant pathologist, and crop health analyst. You carefully identify the crop/plant species first, then assess its health from the image.

Work step by step internally, then respond with ONLY this JSON object:
{
  "isPlant": <true|false>,
  "imageQuality": "<good|fair|poor>",
  "cropType": "<specific crop/plant species if identifiable, else empty string>",
  "cropTypeCandidates": ["<up to 3 plausible species, most likely first>"],
  "growthStage": "<seedling|vegetative|flowering|fruiting|mature|unknown>",
  "healthScore": <number 0-100>,
  "diagnosis": "<concise overall diagnosis in plain language>",
  "identifiedIssues": ["<issue 1>", "<issue 2>"],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>"],
  "confidenceScore": <number 0-100>
}

Rules for accuracy (very important):
- FIRST determine if the image actually shows a plant/crop. If it does not (e.g. a person, animal, object, blurry or dark photo), set "isPlant" to false, "confidenceScore" to a low value, "healthScore" to 0, and put a clear message in "diagnosis" such as "No crop detected — please upload a clear, well-lit photo of the plant, focusing on leaves/fruit.".
- Identify the specific species when you can (e.g. "Maize (Zea mays)", "Tomato", "Cassava"). If genuinely unsure, leave "cropType" empty and list your best guesses in "cropTypeCandidates" with a lower "confidenceScore".
- Do NOT invent diseases or issues. If the plant looks healthy, say so, use a high "healthScore", and keep "identifiedIssues" empty.
- Calibrate "confidenceScore" honestly: high only when the crop and its condition are clearly visible; low for partial, blurry, distant, or ambiguous images.
- If "imageQuality" is "poor", lower confidence and recommend retaking the photo.

When a plant IS present, consider:
- Leaf color and texture (yellowing, chlorosis, browning, necrosis, spots, mosaic patterns)
- Pest damage and visible insects; fungal, bacterial, and viral disease signs
- Nutrient deficiencies (nitrogen, phosphorus, potassium, magnesium, etc.)
- Water stress (wilting, curling) and environmental/heat stress
- Overall vigor and growth stage

Give practical, low-cost, actionable recommendations suitable for smallholder farmers in Zambia.`;

// MIME types that the OpenAI Vision API actually accepts.
const SUPPORTED_VISION_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function normalizeImageUrl(imageBase64: unknown): string {
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    throw new Error('Crop image is required for analysis');
  }

  const trimmed = imageBase64.trim();
  const dataUrlMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);

  if (dataUrlMatch) {
    let [, mimeType, base64Data] = dataUrlMatch;
    mimeType = mimeType.toLowerCase();
    // HEIC/HEIF/etc. are not accepted by the Vision API. The client should be
    // re-encoding to JPEG via fileToJpegDataUrl, but as a defensive fallback we
    // re-tag unsupported MIMEs as JPEG so the request still flows.
    if (!SUPPORTED_VISION_MIME.has(mimeType)) {
      mimeType = 'image/jpeg';
    }
    const cleanedB64 = base64Data.replace(/\s+/g, '');
    if (!cleanedB64) throw new Error('Crop image data is empty');
    return `data:${mimeType};base64,${cleanedB64}`;
  }

  const cleaned = trimmed
    .replace(/^data:[^;]+;base64,/, '')
    .replace(/\s+/g, '');

  if (!cleaned) throw new Error('Crop image data is empty');
  return `data:image/jpeg;base64,${cleaned}`;
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, cropType, additionalContext } = await request.json();
    const normalizedImageUrl = normalizeImageUrl(imageBase64);

    const rawApiKey = process.env.OPENAI_API_KEY;

    if (!rawApiKey) {
      console.error('AI Diagnosis: OPENAI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'AI diagnostics service is not configured. Please contact the administrator to set up the OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    // Sanitize API key: strip newlines, carriage returns, tabs, and control characters
    const apiKey = rawApiKey.replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, '').trim();

    const contextMessage = cropType
      ? `This is a ${cropType} crop. ${additionalContext || ''}`
      : additionalContext || 'Please analyze this crop image for health issues and provide recommendations.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: CROP_ANALYSIS_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: contextMessage,
              },
              {
                type: 'image_url',
                image_url: {
                  url: normalizedImageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1200,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Failed to analyze image' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      result = {
        healthScore: 50,
        diagnosis: content.substring(0, 200),
        identifiedIssues: ['Unable to parse detailed analysis'],
        recommendations: ['Please try again with a clearer image'],
        confidenceScore: 30,
        rawResponse: content,
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI diagnosis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
