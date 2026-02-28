import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const maxDuration = 60; // Keep reasonable max duration for serverless

export async function POST(request: Request) {
  try {
    const { lyrics, caption, duration, musicId, userId } = await request.json();

    if (!caption && !lyrics) {
      return NextResponse.json({ error: 'Caption or lyrics are required' }, { status: 400 });
    }

    // duration comes in as seconds (e.g., 30 to 180)
    const durationSeconds = duration ? parseInt(duration) : 30;

    const input = {
      lyrics: lyrics || "",
      caption: caption || "Generate a high quality music track",
      duration: durationSeconds,
      timeout_seconds: 30
    };

    console.log(`[Replicate API] Generating visoar/ace-step-1.5:`, input);

    const output = await replicate.run(
      "visoar/ace-step-1.5:fd851baef553cb1656f4a05e8f2f8641672f10bc808718f5718b4b4bb2b07794",
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
      audioUrl = (output as any).toString();
    }

    if (!audioUrl) {
      throw new Error("No URL returned from Replicate");
    }

    // Step 2: Download the audio file from Replicate
    console.log(`[Storage] Downloading audio from Replicate URL...`);
    const audioObj = await fetch(audioUrl);
    if (!audioObj.ok) {
      throw new Error("Failed to download generated audio from Replicate");
    }
    const audioBuffer = await audioObj.arrayBuffer();

    // Step 3: Upload to Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found on server.");
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const fileName = `${userId || 'anonymous'}/${musicId || Date.now()}.mp3`;

    console.log(`[Storage] Uploading audio to Supabase Storage: ${fileName}`);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('musics')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error("[Storage] Upload error:", uploadError);
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('musics')
      .getPublicUrl(fileName);

    const finalUrl = publicUrlData.publicUrl;

    console.log(`[Success] Final audio URL:`, finalUrl);

    return NextResponse.json({ success: true, url: finalUrl });
  } catch (error: any) {
    console.error('Replicate error:', error);
    return NextResponse.json({ error: error.message || 'Error generating music via Replicate' }, { status: 500 });
  }
}
