import axios from 'axios';

// Pinata configuration - use NEXT_PUBLIC_ prefix for client-side access
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT || '';
const PINATA_API_URL = 'https://api.pinata.cloud';

export interface UploadResult {
  cid: string;
  url: string;
  size: number;
}

/**
 * Check if Pinata is properly configured
 */
export function isPinataConfigured(): boolean {
  return PINATA_JWT.length > 0;
}

/**
 * Upload a file to IPFS using Pinata
 * Falls back to base64 data URL if Pinata is not configured
 */
export async function uploadToIPFS(file: File): Promise<UploadResult> {
  // Check if Pinata JWT is configured
  if (!PINATA_JWT || PINATA_JWT.length < 10) {
    console.warn('Pinata JWT not configured. Falling back to base64 storage.');
    // Fallback: return a data URL for the image
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve({
          cid: `local-${Date.now()}`,
          url: base64,
          size: file.size,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata for better organization
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'evidence',
        uploadedAt: new Date().toISOString(),
      }
    });
    formData.append('pinataMetadata', metadata);

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        timeout: 60000, // 60 second timeout
      }
    );

    const cid = response.data.IpfsHash;
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

    return {
      cid,
      url,
      size: response.data.PinSize,
    };
  } catch (error: any) {
    console.error('Pinata upload failed:', error);

    // If it's an auth error, provide clear message
    if (error.response?.status === 401) {
      throw new Error('Pinata authentication failed. Please check your PINATA_JWT in environment variables.');
    }

    // If it's a network error or timeout
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to Pinata. Please check your internet connection.');
    }

    throw new Error(`Failed to upload to IPFS: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Upload multiple files to IPFS
 */
export async function uploadMultipleToIPFS(files: File[]): Promise<UploadResult[]> {
  const uploads = files.map(file => uploadToIPFS(file));
  return Promise.all(uploads);
}

/**
 * Upload image with compression
 */
export async function uploadImageToIPFS(file: File, maxWidth: number = 1920): Promise<UploadResult> {
  try {
    // Compress image before upload
    const compressedFile = await compressImage(file, maxWidth);
    return uploadToIPFS(compressedFile);
  } catch (error: any) {
    console.error('Image upload failed:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Compress image before upload
 */
async function compressImage(file: File, maxWidth: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.85 // Quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Upload evidence photos to IPFS
 */
export async function uploadEvidencePhotos(photos: File[]): Promise<string[]> {
  try {
    const results = await uploadMultipleToIPFS(photos);
    return results.map(r => r.url);
  } catch (error: any) {
    console.error('Evidence upload failed:', error);
    throw new Error(`Failed to upload evidence: ${error.message}`);
  }
}

/**
 * Get IPFS URL from CID
 */
export function getIPFSUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}

/**
 * Pin file to ensure it stays on IPFS (already pinned by Pinata)
 */
export async function pinFile(cid: string): Promise<void> {
  // Files are automatically pinned by Pinata
  console.log(`File ${cid} is pinned on Pinata`);
}

/**
 * List all pinned files from Pinata (verification evidence)
 */
export interface PinataFile {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  user_id: string;
  date_pinned: string;
  date_unpinned: string | null;
  metadata: {
    name?: string;
    keyvalues?: {
      type?: string;
      milestone_id?: string;
      farmer_name?: string;
      crop_type?: string;
      officer_name?: string;
      notes?: string;
      [key: string]: string | undefined;
    };
  };
}

export interface PinataListResponse {
  count: number;
  rows: PinataFile[];
}

/**
 * Get all pinned files from Pinata account
 * These are the verification evidence files uploaded by verifiers
 */
export async function listPinnedFiles(options?: {
  status?: 'pinned' | 'unpinned' | 'all';
  pageLimit?: number;
  pageOffset?: number;
  metadata?: Record<string, string>;
}): Promise<PinataListResponse> {
  try {
    const params = new URLSearchParams();
    params.append('status', options?.status || 'pinned');
    params.append('pageLimit', String(options?.pageLimit || 100));
    params.append('pageOffset', String(options?.pageOffset || 0));

    // Add metadata filters if provided
    if (options?.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        params.append(`metadata[keyvalues][${key}]`, JSON.stringify({ value, op: 'eq' }));
      });
    }

    const response = await axios.get(
      `${PINATA_API_URL}/data/pinList?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to list Pinata files:', error);
    throw new Error(`Failed to list pinned files: ${error.message}`);
  }
}

/**
 * Get verification evidence files from Pinata
 * Returns files that were uploaded as verification evidence
 */
export async function getVerificationEvidence(): Promise<{
  id: string;
  cid: string;
  url: string;
  name: string;
  date_pinned: string;
  size: number;
  metadata: PinataFile['metadata']['keyvalues'];
}[]> {
  try {
    const result = await listPinnedFiles({ pageLimit: 100 });

    return result.rows.map(file => ({
      id: file.id,
      cid: file.ipfs_pin_hash,
      url: `https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`,
      name: file.metadata?.name || file.ipfs_pin_hash,
      date_pinned: file.date_pinned,
      size: file.size,
      metadata: file.metadata?.keyvalues || {},
    }));
  } catch (error: any) {
    console.error('Failed to get verification evidence:', error);
    return [];
  }
}
