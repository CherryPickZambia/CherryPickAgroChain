// AI Crop Diagnostics Service
// Uses OpenAI Vision API for crop health analysis

export interface CropDiagnosisResult {
  healthScore: number; // 0-100
  diagnosis: string;
  identifiedIssues: string[];
  recommendations: string[];
  confidenceScore: number;
  cropType?: string;
  growthStage?: string;
  rawResponse?: any;
}

export interface DiagnosticRequest {
  imageBase64: string;
  cropType?: string;
  additionalContext?: string;
}

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

export async function analyzeCropHealth(
  request: DiagnosticRequest
): Promise<CropDiagnosisResult> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY.');
  }

  const contextMessage = request.cropType 
    ? `This is a ${request.cropType} crop. ${request.additionalContext || ''}`
    : request.additionalContext || '';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
                text: contextMessage || 'Please analyze this crop image for health issues and provide recommendations.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: request.imageBase64.startsWith('data:') 
                    ? request.imageBase64 
                    : `data:image/jpeg;base64,${request.imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to analyze image');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      healthScore: result.healthScore || 50,
      diagnosis: result.diagnosis || 'Unable to determine',
      identifiedIssues: result.identifiedIssues || [],
      recommendations: result.recommendations || [],
      confidenceScore: result.confidenceScore || 0,
      cropType: result.cropType,
      growthStage: result.growthStage,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error('AI Diagnosis Error:', error);
    throw new Error(`Crop analysis failed: ${error.message}`);
  }
}

// Alternative: AgriPredict API integration (placeholder)
export async function analyzeCropHealthAgriPredict(
  imageUrl: string,
  cropType?: string
): Promise<CropDiagnosisResult> {
  // AgriPredict API integration would go here
  // This is a placeholder for future integration with local Zambian platform
  throw new Error('AgriPredict integration not yet implemented. Using OpenAI instead.');
}

// Utility to convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
