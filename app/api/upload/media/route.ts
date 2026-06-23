import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PINATA_JWT = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_API_URL = 'https://api.pinata.cloud';

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || VIDEO_EXT.test(file.name);
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || IMAGE_EXT.test(file.name);
}

export async function POST(request: NextRequest) {
  if (!PINATA_JWT || PINATA_JWT.length < 10) {
    return NextResponse.json(
      { error: 'File hosting is not configured. Paste a direct video URL instead.' },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const video = isVideoFile(file);
    const image = isImageFile(file);

    if (!video && !image) {
      return NextResponse.json({ error: 'File must be an image or video (MP4, MOV, WebM).' }, { status: 400 });
    }

    const maxBytes = video ? 200 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: video ? 'Video must be under 200MB.' : 'Image must be under 25MB.' },
        { status: 400 },
      );
    }

    const body = new FormData();
    body.append('file', file);
    body.append(
      'pinataMetadata',
      JSON.stringify({
        name: file.name,
        keyvalues: {
          type: video ? 'hero-video' : 'hero-image',
          uploadedAt: new Date().toISOString(),
        },
      }),
    );

    const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, body, {
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      timeout: video ? 300000 : 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const cid = response.data.IpfsHash as string;

    return NextResponse.json({
      url: `https://gateway.pinata.cloud/ipfs/${cid}`,
      cid,
      mediaType: video ? 'video' : 'image',
      size: response.data.PinSize,
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    console.error('Media upload failed:', error);
    return NextResponse.json(
      { error: err.response?.data?.error || err.message || 'Upload failed.' },
      { status: 500 },
    );
  }
}
