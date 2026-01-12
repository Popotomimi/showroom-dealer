import { NextRequest } from "next/server";
import googleTTS from "google-tts-api";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const urls = googleTTS.getAllAudioUrls(text, {
    lang: "pt",
    slow: false,
    host: "https://translate.google.com",
  });

  const audioBuffers: ArrayBuffer[] = [];
  for (const { url } of urls) {
    const audioRes = await fetch(url);
    const buffer = await audioRes.arrayBuffer();
    audioBuffers.push(buffer);
  }

  const totalLength = audioBuffers.reduce((acc, b) => acc + b.byteLength, 0);
  const mergedBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of audioBuffers) {
    mergedBuffer.set(new Uint8Array(b), offset);
    offset += b.byteLength;
  }

  return new Response(mergedBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}
