import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { resolveUploadMediaType, videoFileNameForUpload } from '@/lib/mediaTypes';

const PINATA_JWT = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_API_URL = 'https://api.pinata.cloud';

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
    const intentRaw = formData.get('intent');
    const intent = intentRaw === 'video' || intentRaw === 'image' ? intentRaw : undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const mediaType = await resolveUploadMediaType(file, intent);
    if (!mediaType) {
      return NextResponse.json(
        {
          error:
            'Could not recognize this file. For Runway exports, select Video mode first, or rename the file to end in .mp4',
        },
        { status: 400 },
      );
    }

    const maxBytes = mediaType === 'video' ? 200 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: mediaType === 'video' ? 'Video must be under 200MB.' : 'Image must be under 25MB.' },
        { status: 400 },
      );
    }

    const uploadName = mediaType === 'video' ? videoFileNameForUpload(file) : file.name;
    const uploadBlob = new File([file], uploadName, {
      type: file.type || (mediaType === 'video' ? 'video/mp4' : 'application/octet-stream'),
    });

    const body = new FormData();
    body.append('file', uploadBlob);
    body.append(
      'pinataMetadata',
      JSON.stringify({
        name: uploadName,
        keyvalues: {
          type: mediaType === 'video' ? 'hero-video' : 'hero-image',
          uploadedAt: new Date().toISOString(),
        },
      }),
    );

    const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, body, {
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      timeout: mediaType === 'video' ? 300000 : 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const cid = response.data.IpfsHash as string;

    return NextResponse.json({
      url: `https://gateway.pinata.cloud/ipfs/${cid}`,
      cid,
      mediaType,
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
