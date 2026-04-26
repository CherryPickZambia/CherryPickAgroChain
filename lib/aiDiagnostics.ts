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
  try {
    // Call server-side API route to avoid CORS issues
    const response = await fetch('/api/ai/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: request.imageBase64,
        cropType: request.cropType,
        additionalContext: request.additionalContext,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze image');
    }

    const result = await response.json();

    return {
      healthScore: result.healthScore || 50,
      diagnosis: result.diagnosis || 'Unable to determine',
      identifiedIssues: result.identifiedIssues || [],
      recommendations: result.recommendations || [],
      confidenceScore: result.confidenceScore || 0,
      cropType: result.cropType,
      growthStage: result.growthStage,
      rawResponse: result,
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

/**
 * Convert any browser-loadable image (HEIC/PNG/WebP/JPEG) into a normalized JPEG
 * data URL with sensible max dimensions so the OpenAI Vision API receives a
 * compact, well-formed payload.
 *
 * This is the root-cause fix for the iOS Safari error
 * "Crop analysis failed: The string did not match the expected pattern" — that
 * error is thrown when the API receives an oversized, HEIC, or otherwise
 * malformed data URL. Re-encoding through a canvas guarantees a valid
 * image/jpeg base64 string for every supported OS / browser.
 */
export async function fileToJpegDataUrl(
  file: File,
  options: { maxDim?: number; quality?: number } = {}
): Promise<string> {
  const maxDim = options.maxDim ?? 1280;
  const quality = options.quality ?? 0.85;

  // If we're not in a browser, fall back to raw base64 (e.g. for SSR/unit tests)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fileToBase64(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Unsupported image format. Please use a JPG or PNG photo.'));
      el.src = objectUrl;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) throw new Error('Could not read image dimensions');

    const scale = Math.min(1, maxDim / Math.max(w, h));
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser does not support canvas 2D context');
    ctx.drawImage(img, 0, 0, targetW, targetH);

    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
