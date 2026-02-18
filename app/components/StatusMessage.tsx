interface StatusMessageProps {
  message: string;
}

export function StatusMessage({ message }: StatusMessageProps) {
  return (
    <div className="mb-4 text-lg text-blue-500 font-semibold animate-pulse">
      {message}
    </div>
  );
}
