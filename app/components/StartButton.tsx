import { motion } from "framer-motion";

interface StartButtonProps {
  onClick: () => void;
  text: string;
  listening: boolean;
  speaking: boolean;
}

export function StartButton({
  onClick,
  text,
  listening,
  speaking,
}: StartButtonProps) {
  return (
    <motion.button
      onClick={onClick}
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
      {text}
    </motion.button>
  );
}
