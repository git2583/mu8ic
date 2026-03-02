import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const maxDuration = 300; // Increase max duration for Replicate waiting

export async function POST(request: Request) {
  try {
    const { lyrics, caption, duration, batch_size, musicId, userId } = await request.json();

    if (!caption && !lyrics) {
      return NextResponse.json({ error: 'Caption or lyrics are required' }, { status: 400 });
    }

    const durationSeconds = duration ? parseInt(duration) : 60;
    const batchSize = batch_size ? parseInt(batch_size) : 1;

    const input = {
      lyrics: lyrics || "",
      caption: caption || "Generate a high quality music track",
      duration: durationSeconds,
      batch_size: batchSize,
      poll_interval: 3,
      timeout_seconds: 1800
    };

    console.log(`[Replicate API] Generating visoar/ace-step-1.5:`, input);

    const output = await replicate.run(
      "visoar/ace-step-1.5:fd851baef553cb1656f4a05e8f2f8641672f10bc808718f5718b4b4bb2b07794",
      { input }
    );

    let audioUrls: string[] = [];
    if (output && typeof (output as any).url === 'function') {
      audioUrls.push((output as any).url());
    } else if (Array.isArray(output)) {
      audioUrls = output.map((o: any) => typeof o === 'string' ? o : (typeof o.url === 'function' ? o.url() : o));
    } else if (typeof output === 'string') {
      audioUrls.push(output);
    } else if (output && typeof output === 'object') {
      audioUrls.push((output as any).toString());
    }

    if (audioUrls.length === 0 || !audioUrls[0]) {
      throw new Error("No URL returned from Replicate");
    }

    console.log(`[Success] Generated ${audioUrls.length} Replicate URLs:`, audioUrls);

    // Return the raw audio URLs from Replicate to be uploaded via UI
    return NextResponse.json({ success: true, urls: audioUrls });
  } catch (error: any) {
    console.error('Replicate error:', error);
    return NextResponse.json({ error: error.message || 'Error generating music via Replicate' }, { status: 500 });
  }
}
