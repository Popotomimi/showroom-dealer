"use client";

import { useState, useEffect, useRef } from "react";
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
  const [nome, setNome] = useState<string>("");
  const [produto, setProduto] = useState<string>("");
  const nomeRef = useRef<string>("");
  const produtoRef = useRef<string>("");
  const ultimaMensagemIARef = useRef<string>("");
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null,
  );
  const autoRespondRef = useRef<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [conversaAtiva, setConversaAtiva] = useState(false);
  const [processando, setProcessando] = useState(false);

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

        const normalizedReply = reply
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        const palavrasChave = [
          ["entrada", "showroom", "liberad"],
          ["entrar", "showroom", "liberad"],
        ];

        const contemTodasPalavras = (
          frase: string,
          grupo: string[],
        ): boolean => {
          return grupo.every((palavra: string) => frase.includes(palavra));
        };

        const devePararAutoResponder = palavrasChave.some((grupo) =>
          contemTodasPalavras(normalizedReply, grupo),
        );

        if (devePararAutoResponder) {
          autoRespondRef.current = false;
          setConversaAtiva(false);
          // Salvar no banco usando refs para garantir valores corretos
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
                recognitionRef.current?.start();
                setListening(true);
              }, 100);
            }
          }, 200);
        } else {
          if (recognitionRef.current) {
            recognitionRef.current.abort();
            setTimeout(() => {
              recognitionRef.current?.start();
              setListening(true);
            }, 100);
          }
        }
      };

      audio.play();
    } catch (error) {
      setProcessando(false);
      console.error("Erro em sendMessage:", error);
      setSpeaking(false);
      setListening(false);
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
      setListening(false);
      setSpeaking(false);
      setConversaAtiva(false);
    } catch (error) {
      console.error("Erro em resetConversation:", error);
    }
  };

  useEffect(() => {
    try {
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
          autoRespondRef.current = true;

          // Use a última mensagem da IA para decidir o contexto
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
        };

        recog.onend = () => {
          setListening(false);
        };

        setTimeout(() => {
          setRecognition(recog);
          recognitionRef.current = recog;
        }, 0);
      }
    } catch (error) {
      console.error("Erro ao inicializar SpeechRecognition:", error);
    }
  }, []);

  const startListening = (): void => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
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
    <div className="flex flex-col items-center justify-center min-h-screen text-zinc-900 bg-gray-100 p-6 py-54 relative">
      {/* Ícone de reset no topo */}
      <div className="absolute top-4 right-4">
        <button
          onClick={resetConversation}
          className="p-2 bg-red-500 text-white cursor-pointer rounded-full shadow-md hover:bg-red-600 transition"
        >
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

      {processando && (
        <div className="mb-4 text-lg text-blue-500 font-semibold animate-pulse">
          Processando resposta...
        </div>
      )}

      {listening && (
        <div className="mb-4 text-lg text-blue-500 font-semibold animate-pulse">
          Ouvindo...
        </div>
      )}

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
          <motion.button
            onClick={() => {
              setConversaAtiva(true);
              autoRespondRef.current = true;
              startListening();
            }}
            animate={
              listening
                ? { scale: [1, 1.05, 1] }
                : speaking
                  ? { rotate: [0, 2, -2, 0] }
                  : {}
            }
            transition={{ repeat: Infinity, duration: 1 }}
            className="px-6 py-3 bg-amber-300 text-black font-bold cursor-pointer rounded-lg shadow-md hover:bg-amber-400 transition"
          >
            {getButtonText()}
          </motion.button>
        </>
      )}
    </div>
  );
}
