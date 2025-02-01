import { Plus } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Input } from "./ui/input";
import { Noop, RefCallBack } from "react-hook-form";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/common";

export default function FileInput({
  className,
  value,
  onChange,
  ref,
  fieldProps,
}: {
  className?: string;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (...event: any[]) => void;
  ref: RefCallBack;
  fieldProps: {
    onBlur: Noop;
    disabled?: boolean;
    name?: string;
  };
}) {
  const [fileEnter, setFileEnter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  console.log(value ? "n" : "y");
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setFileEnter(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setFileEnter(false);
      }}
      onDragEnd={(e) => {
        e.preventDefault();
        setFileEnter(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setFileEnter(false);
        if (e.dataTransfer.items) {
          const item = e.dataTransfer.items[0];
          if (item.kind === "file") {
            const file = item.getAsFile();
            console.log(file);
            if (file) {
              if (fileInputRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInputRef.current.files = dataTransfer.files;
                const res = await uploadImage(file);
                onChange(res?.secure_url);
              }
            }
          }
        }
      }}
      className={cn(
        fileEnter
          ? "border-2 border-muted-foreground/50 border-dashed"
          : "border-2 border-[#aaaaaa]",
        "mx-auto box-border bg-background group relative grid w-24 aspect-square cursor-pointer place-items-center rounded-lg object-fit text-center transition hover:bg-muted/25",
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Invisible Input */}
      {!!value ? (
        <Image
          src={value}
          className="absolute p-2 w-full h-full aspect-[72/97] z-10 "
          alt="cover image"
          sizes="100vw"
          width={0}
          height={0}
        />
      ) : isLoading ? (
        <div className="grid place-items-center absolute p-2 w-full h-full aspect-[72/97] z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Plus className=" stroke-[#aaaaaa] absolute w-8 h-8 z-10" />
      )}
      <Input
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        ref={(e) => {
          ref(e);
          fileInputRef.current = e;
        }}
        type="file"
        accept="image/*"
        onChange={async (event) => {
          setIsLoading(true);
          const res = await uploadImage(event.target!.files![0]);
          setIsLoading(false);
          onChange(res?.secure_url);
        }}
      />
      <Input type="hidden" value={value} {...fieldProps} />
    </div>
  );
}
