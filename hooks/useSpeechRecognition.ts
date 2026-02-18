import { useEffect, useRef, useState } from "react";

export function useSpeechRecognition(onResult: (transcript: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      const recog: SpeechRecognition = new SpeechRecognitionConstructor();
      recog.lang = "pt-BR";
      recog.continuous = false;
      recog.interimResults = false;

      recog.onresult = (event: SpeechRecognitionEvent) => {
        const transcript: string = event.results[0][0].transcript;
        onResult(transcript);
      };
      recog.onend = () => setListening(false);

      recognitionRef.current = recog;
    }
  }, [onResult]);

  const startListening = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  return { listening, startListening, recognitionRef };
}
