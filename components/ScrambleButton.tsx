import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useState } from "react";

export default function ScrambleButton({
  text,
  className,
  onClick,
  delay = 100,
}: {
  text: string;
  className?: string;
  onClick?: () => void;
  delay: number;
}) {
  const [displayText, setDisplayText] = useState(text);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const handleMouseOver = () => {
    let iterations = 0;
    const originalText = text;

    const intervalId = setInterval(() => {
      setDisplayText((prevText) =>
        prevText
          .split("")
          .map((letter, index) => {
            if (index < iterations) {
              return originalText[index];
            }
            return letters[Math.floor(Math.random() * 26)];
          })
          .join("")
      );

      if (iterations >= originalText.length) {
        clearInterval(intervalId);
      }
      iterations += 1;
    }, delay / originalText.length);
  };

  return (
    <Button
      onMouseOver={handleMouseOver}
      onClick={onClick}
      className={cn(className)}
    >
      {displayText}
    </Button>
  );
}
