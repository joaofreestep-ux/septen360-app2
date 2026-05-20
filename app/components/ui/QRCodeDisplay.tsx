type QRCodeDisplayProps = {
  uuid: string;
  className?: string;
};

export function QRCodeDisplay({ uuid, className = "" }: QRCodeDisplayProps) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-lg border border-zinc-300 ${className}`.trim()}>
      <img
        src={`/api/qrcode?uuid=${uuid}`}
        className="w-56 h-56 mx-auto"
        alt="QR Code"
      />
    </div>
  );
}
