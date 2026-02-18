import { FaRedoAlt } from "react-icons/fa";

interface ResetButtonProps {
  onClick: () => void;
}

export function ResetButton({ onClick }: ResetButtonProps) {
  return (
    <div className="absolute top-4 right-4">
      <button
        onClick={onClick}
        className="p-2 bg-red-500 text-white cursor-pointer rounded-full shadow-md hover:bg-red-600 transition"
      >
        <FaRedoAlt size={20} />
      </button>
    </div>
  );
}
