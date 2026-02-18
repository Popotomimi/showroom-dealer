"use client";

// React
import { useState, useRef } from "react";

// Animations and Icons
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { FaArrowDown } from "react-icons/fa";

// Utils
import { getAnimation } from "@/utils/animations";
import { normalizeText, contemTodasPalavras } from "@/utils/textHelpers";

// Hooks
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// Components
import { ResetButton } from "./components/ResetButton";
import { StartButton } from "./components/StartButton";
import { StatusMessage } from "./components/StatusMessage";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [nome, setNome] = useState<string>("");
  const [produto, setProduto] = useState<string>("");
  const nomeRef = useRef<string>("");
  const produtoRef = useRef<string>("");
  const ultimaMensagemIARef = useRef<string>("");
  const autoRespondRef = useRef<boolean>(false);
  const [conversaAtiva, setConversaAtiva] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // SpeechRecognition custom hook
  const { listening, startListening, recognitionRef } = useSpeechRecognition(
    async (transcript: string) => {
      setChat((prev) => [...prev, { role: "user", content: transcript }]);
      autoRespondRef.current = true;

      if (ultimaMensagemIARef.current.toLowerCase().includes("seu nome")) {
        nomeRef.current = transcript;
        setNome(transcript);
      }
      if (
        ultimaMensagemIARef.current
          .toLowerCase()
          .includes("qual tipo de produto")
      ) {
        produtoRef.current = transcript;
        setProduto(transcript);
      }

      await sendMessage(transcript);
    },
  );

  const sendMessage = async (
    message: string,
    nomeAtual?: string,
    produtoAtual?: string,
  ): Promise<void> => {
    try {
      setProcessando(true);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error("Erro na requisição /api/chat");

      const data: { reply: string } = await res.json();
      const reply: string = data.reply;

      setChat((prev) => [...prev, { role: "assistant", content: reply }]);
      ultimaMensagemIARef.current = reply;

      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply }),
      });

      if (!ttsRes.ok) throw new Error("Erro na requisição /api/tts");

      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onplay = () => {
        setSpeaking(true);
        setProcessando(false);
      };

      audio.onended = () => {
        setSpeaking(false);

        const palavrasChave = [
          ["entrada", "showroom", "liberad"],
          ["entrar", "showroom", "liberad"],
        ];

        const normalizedReply = normalizeText(reply);

        const devePararAutoResponder = palavrasChave.some((grupo) =>
          contemTodasPalavras(normalizedReply, grupo),
        );

        if (devePararAutoResponder) {
          autoRespondRef.current = false;
          setConversaAtiva(false);
          fetch("/api/interacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome: nomeRef.current,
              produto: produtoRef.current,
              dataHora: new Date().toISOString(),
            }),
          });

          setTimeout(() => {
            resetConversation();
          }, 2000);
        } else if (autoRespondRef.current) {
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.abort();
              setTimeout(() => {
                startListening();
              }, 100);
            }
          }, 200);
        } else {
          if (recognitionRef.current) {
            recognitionRef.current.abort();
            setTimeout(() => {
              startListening();
            }, 100);
          }
        }
      };

      audio.play();
    } catch (error) {
      setProcessando(false);
      console.error("Erro em sendMessage:", error);
      setSpeaking(false);
    }
  };

  const resetConversation = async (): Promise<void> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      if (!res.ok) throw new Error("Erro ao resetar conversa");

      setChat([]);
      setConversaAtiva(false);
      setSpeaking(false);
    } catch (error) {
      console.error("Erro em resetConversation:", error);
    }
  };

  const getButtonText = (): string => {
    if (speaking) return "Respondendo...";
    if (listening) return "Ouvindo...";
    return "Iniciar Conversa";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-zinc-900 bg-gray-100 p-6 py-54 relative">
      {/* Ícone de reset no topo */}
      <ResetButton onClick={resetConversation} />

      <h1 className="text-8xl font-bold">
        Dealer <span className="text-amber-400">Shop</span>
      </h1>
      <h2 className="mt-5 font-semibold text-2xl">Distribuição com solução</h2>

      <div className="w-100 h-100 mb-4">
        <Lottie animationData={getAnimation(speaking, listening)} loop={true} />
      </div>

      {processando && <StatusMessage message="Processando resposta..." />}
      {listening && <StatusMessage message="Ouvindo..." />}

      {!conversaAtiva && (
        <>
          {!listening && !speaking && (
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="mb-2 text-amber-500"
            >
              <FaArrowDown size={30} />
            </motion.div>
          )}
          <StartButton
            onClick={() => {
              setConversaAtiva(true);
              autoRespondRef.current = true;
              startListening();
            }}
            text={getButtonText()}
            listening={listening}
            speaking={speaking}
          />
        </>
      )}
    </div>
  );
}
