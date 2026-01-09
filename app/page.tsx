"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";

import listeningAnimation from "../public/animations/assistant-listening.json";
import speakingAnimation from "../public/animations/assistant-speaking.json";
import stopAnimation from "../public/animations/assistant-stop.json";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [listening, setListening] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );

  const sendMessage = async (message: string): Promise<void> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data: { reply: string } = await res.json();
    const reply: string = data.reply;

    setChat((prev) => [...prev, { role: "assistant", content: reply }]);
    setSpeaking(true);

    const ttsRes = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reply }),
    });

    const audioBlob = await ttsRes.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      setSpeaking(false);
      if (recognition) {
        recognition.start();
        setListening(true);
      }
    };

    audio.play();
  };

  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recog: SpeechRecognition = new SpeechRecognitionConstructor();
      recog.lang = "pt-BR";
      recog.continuous = false;
      recog.interimResults = false;

      recog.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript: string = event.results[0][0].transcript;
        setChat((prev) => [...prev, { role: "user", content: transcript }]);
        await sendMessage(transcript);
      };

      recog.onend = () => {
        setListening(false);
      };

      setTimeout(() => setRecognition(recog), 0);
    }
  }, []);

  const startListening = (): void => {
    if (recognition) {
      setListening(true);
      recognition.start();
    }
  };

  const getAnimation = (): object => {
    if (speaking) return speakingAnimation;
    if (listening) return listeningAnimation;
    return stopAnimation;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-zinc-900 bg-gray-100 p-6">
      <h1 className="text-8xl font-bold">
        Dealer <span className="text-amber-400">Shop</span>
      </h1>
      <h2 className="mt-5 font-semibold text-2xl">Distribuição com solução</h2>

      <div className="w-100 h-100 mb-4">
        <Lottie animationData={getAnimation()} loop={true} />
      </div>

      <button
        onClick={startListening}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
        {listening ? "Ouvindo..." : "Iniciar Conversa"}
      </button>
    </div>
  );
}
