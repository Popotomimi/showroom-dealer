import { NextRequest } from "next/server";
import googleTTS from "google-tts-api";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const url = googleTTS.getAudioUrl(text, {
    lang: "pt",
    slow: false,
    host: "https://translate.google.com",
  });

  const audioRes = await fetch(url);
  const buffer = await audioRes.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}
