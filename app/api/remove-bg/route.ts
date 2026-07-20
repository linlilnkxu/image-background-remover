import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let image: File | null = null;
  try {
    const form = await request.formData();
    image = form.get('image') as File | null;
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: 'No image file' }, { status: 400 });
  }

  const bgForm = new FormData();
  bgForm.append('image_file', image);

  const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: bgForm,
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error('remove.bg error:', resp.status, text);
    return NextResponse.json({ error: 'API error (' + resp.status + ')' }, { status: resp.status });
  }

  return new NextResponse(resp.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache',
    },
  });
}