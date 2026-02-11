import { NextRequest } from "next/server";
import sdk from "microsoft-cognitiveservices-speech-sdk";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY!,
    process.env.AZURE_SPEECH_REGION!,
  );
  speechConfig.speechSynthesisLanguage = "pt-BR";
  speechConfig.speechSynthesisVoiceName = "pt-BR-AntonioNeural";

  return new Promise<Response>((resolve, reject) => {
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(
            new Response(result.audioData, {
              headers: { "Content-Type": "audio/mpeg" },
            }),
          );
        } else {
          reject("Erro na síntese de voz");
        }
        synthesizer.close();
      },
      (err) => {
        synthesizer.close();
        reject(err);
      },
    );
  });
}
