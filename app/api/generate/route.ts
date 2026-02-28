import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Setting max duration for Vercel/Next.js function (if applicable, up to tier limit)
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { prompt, musicId } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const input = {
      prompt: prompt,
      output_format: "wav_cd_quality",
      music_length_ms: 30000,
      force_instrumental: false
    };

    console.log(`[Replicate API] Generating visoar/ace-step-1.5 for prompt: "${prompt}", musicId: "${musicId}"`);

    const output = await replicate.run(
      "visoar/ace-step-1.5",
      { input }
    );

    let audioUrl = "";
    if (output && typeof (output as any).url === 'function') {
      audioUrl = (output as any).url();
    } else if (Array.isArray(output) && output.length > 0) {
      audioUrl = typeof output[0] === 'string' ? output[0] : (typeof output[0].url === 'function' ? output[0].url() : output[0]);
    } else if (typeof output === 'string') {
      audioUrl = output;
    } else if (output && typeof output === 'object') {
      // In some cases, it returns an object or a stream, we can stringify or just fallback
      audioUrl = (output as any).toString();
    }

    if (!audioUrl) {
      throw new Error("No URL returned from Replicate");
    }

    return NextResponse.json({ success: true, url: audioUrl });
  } catch (error: any) {
    console.error('Replicate error:', error);
    return NextResponse.json({ error: error.message || 'Error generating music via Replicate' }, { status: 500 });
  }
}
