import QRCode from "qrcode";

/** Server-rendered QR code (SVG), so nothing extra ships to the browser. */
export default async function TicketQr({ value, size = 200 }: { value: string; size?: number }) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
  return (
    <div
      className="mx-auto rounded-lg bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Your check-in QR code"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
