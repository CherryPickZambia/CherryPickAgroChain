import { NextRequest, NextResponse } from 'next/server';

const CROP_ANALYSIS_PROMPT = `You are an expert agricultural scientist and crop health analyst. Analyze this crop image and provide a detailed assessment.

Respond in the following JSON format only:
{
  "healthScore": <number 0-100>,
  "diagnosis": "<brief overall diagnosis>",
  "cropType": "<identified crop type if visible>",
  "growthStage": "<growth stage if identifiable>",
  "identifiedIssues": [
    "<issue 1>",
    "<issue 2>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>"
  ],
  "confidenceScore": <number 0-100>
}

Consider:
- Leaf color and texture (yellowing, browning, spots)
- Signs of pest damage or disease
- Nutrient deficiencies (nitrogen, phosphorus, potassium, etc.)
- Water stress indicators
- Overall plant vigor and growth patterns
- Environmental stress signs

Provide practical, actionable recommendations suitable for smallholder farmers in Zambia.`;

function normalizeImageUrl(imageBase64: unknown): string {
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    throw new Error('Crop image is required for analysis');
  }

  const trimmed = imageBase64.trim();
  const dataUrlMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);

  if (dataUrlMatch) {
    const [, mimeType, base64Data] = dataUrlMatch;
    return `data:${mimeType};base64,${base64Data.replace(/\s+/g, '')}`;
  }

  const cleaned = trimmed
    .replace(/^data:[^;]+;base64,/, '')
    .replace(/\s+/g, '');

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
        model: 'gpt-4o-mini',
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
        max_tokens: 1000,
        temperature: 0.3,
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
