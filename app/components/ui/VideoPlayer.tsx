type VideoPlayerProps = {
  src: string;
  type?: string;
  className?: string;
};

export function VideoPlayer({ src, type = "video/mp4", className = "" }: VideoPlayerProps) {
  return (
    <video controls className={`w-full rounded-xl bg-black ${className}`.trim()}>
      <source src={src} type={type} />
    </video>
  );
}
