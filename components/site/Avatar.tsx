import { initials } from "@/lib/domain";
import { cn } from "@/lib/utils";

export default function Avatar({
  name,
  src,
  size = 32,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.38) };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        style={style}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      style={style}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary/20 font-chakra font-semibold text-primary-foreground ring-1 ring-primary/40",
        className
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
