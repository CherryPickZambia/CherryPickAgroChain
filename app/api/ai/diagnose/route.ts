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

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, cropType, additionalContext } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

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
        model: 'gpt-4.1-2025-04-14',
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
                  url: imageBase64.startsWith('data:') 
                    ? imageBase64 
                    : `data:image/jpeg;base64,${imageBase64}`,
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
