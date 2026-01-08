"use client";

import { useState, useEffect } from "react";
import { FaRobot } from "react-icons/fa";
import { motion } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );

  useEffect(() => {
    // Carregar vozes disponíveis
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();

      // Tenta achar a voz "Maria" em pt-BR
      const mariaVoice = availableVoices.find(
        (v) => v.lang === "pt-BR" && v.name.toLowerCase().includes("maria")
      );

      if (mariaVoice) {
        setSelectedVoice(mariaVoice);
      } else {
        // Se não achar "Maria", pega a primeira voz em pt-BR
        const brVoice = availableVoices.find((v) => v.lang === "pt-BR");
        if (brVoice) setSelectedVoice(brVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Configuração do reconhecimento de voz
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recog: SpeechRecognition = new SpeechRecognition();
      recog.lang = "pt-BR";
      recog.continuous = false;
      recog.interimResults = false;

      recog.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setChat((prev) => [...prev, { role: "user", content: transcript }]);
        await sendMessage(transcript);
      };

      recog.onend = () => {
        setListening(false);
      };

      setRecognition(recog);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      setListening(true);
      recognition.start();
    }
  };

  const sendMessage = async (message: string) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    const reply: string = data.reply;

    setChat((prev) => [...prev, { role: "assistant", content: reply }]);

    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = "pt-BR";
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      if (recognition) {
        recognition.start();
        setListening(true);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-zinc-900 bg-gray-100 p-6">
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-blue-600 text-6xl mb-6">
        <FaRobot />
      </motion.div>

      <button
        onClick={startListening}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
        {listening ? "Ouvindo..." : "Iniciar Conversa"}
      </button>

      {/* Caixa de chat estilizada */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 mt-6 space-y-4">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}>
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
