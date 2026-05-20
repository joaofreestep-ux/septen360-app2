type LoaderProps = {
  text?: string;
  className?: string;
};

export function Loader({ text = "Processando...", className = "" }: LoaderProps) {
  return <div className={`text-gray-300 animate-pulse ${className}`.trim()}>{text}</div>;
}
