"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { FaArrowDown, FaRedoAlt } from "react-icons/fa";

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
    setSpeaking(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data: { reply: string } = await res.json();
    const reply: string = data.reply;

    setChat((prev) => [...prev, { role: "assistant", content: reply }]);

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

  const resetConversation = async (): Promise<void> => {
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    setChat([]); // limpa também no frontend
    setListening(false);
    setSpeaking(false);
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

  const getButtonText = (): string => {
    if (speaking) return "Respondendo...";
    if (listening) return "Ouvindo...";
    return "Iniciar Conversa";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-zinc-900 bg-gray-100 p-6">
      {/* Ícone de reset no topo */}
      <div className="absolute top-4 right-4">
        <button
          onClick={resetConversation}
          className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition">
          <FaRedoAlt size={20} />
        </button>
      </div>

      <h1 className="text-8xl font-bold">
        Dealer <span className="text-amber-400">Shop</span>
      </h1>
      <h2 className="mt-5 font-semibold text-2xl">Distribuição com solução</h2>

      <div className="w-100 h-100 mb-4">
        <Lottie animationData={getAnimation()} loop={true} />
      </div>

      {!listening && !speaking && (
        <motion.div
          initial={{ y: -10 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="mb-2 text-amber-500">
          <FaArrowDown size={30} />
        </motion.div>
      )}

      <motion.button
        onClick={startListening}
        animate={
          listening
            ? { scale: [1, 1.05, 1] }
            : speaking
            ? { rotate: [0, 2, -2, 0] }
            : {}
        }
        transition={{ repeat: Infinity, duration: 1 }}
        className="px-6 py-3 bg-amber-300 text-black font-bold cursor-pointer rounded-lg shadow-md hover:bg-amber-400 transition">
        {getButtonText()}
      </motion.button>
    </div>
  );
}
