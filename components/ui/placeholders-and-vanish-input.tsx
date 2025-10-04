"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
  useModal,
} from "@/components/ui/animated-modal";
import { Settings } from "lucide-react";
import Image from "next/image";
import { FileUpload } from "@/components/ui/file-upload";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

function SaveButton() {
  const { setOpen } = useModal();

  return (
    <HoverBorderGradient
      as="button"
      type="button"
      onClick={() => setOpen(false)}
      containerClassName="rounded-xl"
      className="bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] text-white px-8 py-2 font-medium"
    >
      שמור הגדרות
    </HoverBorderGradient>
  );
}

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  selectedType,
  onTypeChange,
  uploadMode,
  onUploadModeChange,
  uploadedFiles,
  onFilesChange,
  selectedCharacter,
  onCharacterChange,
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  selectedType: 'image' | 'video';
  onTypeChange: (type: 'image' | 'video') => void;
  uploadMode: 'upload' | 'premade';
  onUploadModeChange: (mode: 'upload' | 'premade') => void;
  uploadedFiles: File[];
  onFilesChange: (files: File[]) => void;
  selectedCharacter: string | null;
  onCharacterChange: (character: string | null) => void;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current); // Clear the interval when the tab is not visible
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation(); // Restart the interval when the tab becomes visible
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: any[] = [];

    for (let t = 0; t < 800; t++) {
      let i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        let e = i + 4 * n;
        if (
          pixelData[e] !== 0 &&
          pixelData[e + 1] !== 0 &&
          pixelData[e + 2] !== 0
        ) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          setValue("");
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !animating) {
      vanishAndSubmit();
    }
  };

  const vanishAndSubmit = () => {
    setAnimating(true);
    draw();

    const value = inputRef.current?.value || "";
    if (value && inputRef.current) {
      const maxX = newDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      animate(maxX);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    vanishAndSubmit();
    onSubmit && onSubmit(e);
  };

  const handleFileUpload = (files: File[]) => {
    onFilesChange(files);
    console.log('Files uploaded:', files);
  };

  return (
    <form
      className={cn(
        "w-full relative max-w-xl mx-auto bg-white dark:bg-zinc-800 h-16 md:h-20 rounded-full overflow-hidden shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200",
        value && "bg-gray-50"
      )}
      onSubmit={handleSubmit}
    >
      <canvas
        className={cn(
          "absolute pointer-events-none text-lg transform scale-50 top-[20%] left-2 sm:left-8 origin-top-left filter invert dark:invert-0 pr-20",
          !animating ? "opacity-0" : "opacity-100"
        )}
        ref={canvasRef}
      />
      <input
        onChange={(e) => {
          if (!animating) {
            setValue(e.target.value);
            onChange && onChange(e);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        value={value}
        type="text"
        className={cn(
          "w-full relative text-base md:text-lg z-50 border-none dark:text-white bg-transparent text-black h-full rounded-full focus:outline-none focus:ring-0 pl-24 pr-24",
          animating && "text-transparent dark:text-transparent"
        )}
        dir="rtl"
      />

      {/* Send button on the LEFT */}
      <button
        disabled={!value}
        type="submit"
        className="absolute left-3 top-1/2 z-50 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full disabled:bg-gray-100 bg-black dark:bg-zinc-900 dark:disabled:bg-zinc-800 transition duration-200 flex items-center justify-center"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-300 h-4 w-4"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            d="M5 12l14 0"
            initial={{
              strokeDasharray: "50%",
              strokeDashoffset: "50%",
            }}
            animate={{
              strokeDashoffset: value ? 0 : "50%",
            }}
            transition={{
              duration: 0.3,
              ease: "linear",
            }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>

      {/* Settings button on the RIGHT with Modal */}
      <Modal>
        <ModalTrigger className="absolute right-3 top-1/2 z-50 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition duration-200 flex items-center justify-center">
          <Settings className="h-5 w-5 md:h-6 md:w-6 text-gray-700 dark:text-gray-300" />
        </ModalTrigger>
        <ModalBody>
          <ModalContent className="overflow-y-auto max-h-[70vh]">
            <h4 className="text-lg md:text-2xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8" dir="rtl">
              הגדרות יצירה
            </h4>

            {/* Type Selection */}
            <div className="space-y-4 mb-6" dir="rtl">
              <label className="text-sm font-bold uppercase text-neutral-700 dark:text-neutral-300">
                סוג יצירה
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onTypeChange('image')}
                  className={cn(
                    "p-4 rounded-xl border-2 font-medium transition",
                    selectedType === 'image'
                      ? "border-[#fb6f92] bg-pink-50 dark:bg-pink-900/20 text-neutral-900 dark:text-white"
                      : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-[#fb6f92]"
                  )}
                >
                  תמונה
                </button>
                <button
                  type="button"
                  onClick={() => onTypeChange('video')}
                  className={cn(
                    "p-4 rounded-xl border-2 font-medium transition",
                    selectedType === 'video'
                      ? "border-[#fb6f92] bg-pink-50 dark:bg-pink-900/20 text-neutral-900 dark:text-white"
                      : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-[#fb6f92]"
                  )}
                >
                  וידאו
                </button>
              </div>
            </div>

            {/* Upload Mode Selection */}
            <div className="space-y-4 mb-6" dir="rtl">
              <label className="text-sm font-bold uppercase text-neutral-700 dark:text-neutral-300">
                אופן העלאה
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUploadModeChange('upload')}
                  className={cn(
                    "p-4 rounded-xl border-2 font-medium transition",
                    uploadMode === 'upload'
                      ? "border-[#fb6f92] bg-pink-50 dark:bg-pink-900/20 text-neutral-900 dark:text-white"
                      : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-[#fb6f92]"
                  )}
                >
                  העלאת תמונות
                </button>
                <button
                  type="button"
                  onClick={() => onUploadModeChange('premade')}
                  className={cn(
                    "p-4 rounded-xl border-2 font-medium transition",
                    uploadMode === 'premade'
                      ? "border-[#fb6f92] bg-pink-50 dark:bg-pink-900/20 text-neutral-900 dark:text-white"
                      : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-[#fb6f92]"
                  )}
                >
                  דמות קיימת
                </button>
              </div>
            </div>

            {/* Upload Instructions - Only show when upload mode is selected */}
            {uploadMode === 'upload' && (
            <div className="space-y-4 mb-6">
              <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl" dir="rtl">
                <div className="rounded-lg size-8 flex items-center justify-center bg-green-500 text-white shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="size-4">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9.99999 15.1715L19.192 5.97852L20.607 7.39252L9.99999 17.9995L3.63599 11.6355L5.04999 10.2215L9.99999 15.1715Z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm uppercase mb-1 text-neutral-900 dark:text-neutral-100">
                    העלו 20+ תמונות לתוצאות מיטביות
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    העלו תמונות באיכות גבוהה של אדם אחד. ככל שתספקו יותר תמונות, התוצאה תהיה טובה יותר - הציגו זוויות שונות, הבעות פנים ברורות וזהות עקבית
                  </p>
                </div>
              </div>

              {/* Good Examples */}
              <div className="grid grid-cols-5 gap-2">
                {['Good Character 01.webp', 'Characters 02.webp', 'Good Character 03.webp', 'Good Character 04.webp', 'Good Character 05.webp'].map((img, i) => (
                  <div key={i} className="relative aspect-[0.8] rounded-lg overflow-hidden border-2 border-white">
                    <Image
                      src={`/assets/characters/${img}`}
                      alt={`Good example ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 rounded-lg size-6 flex items-center justify-center bg-green-500 text-white">
                      <svg width="16" height="16" viewBox="0 0 20 20" className="size-3">
                        <path fillRule="evenodd" clipRule="evenodd" d="M9.99999 15.1715L19.192 5.97852L20.607 7.39252L9.99999 17.9995L3.63599 11.6355L5.04999 10.2215L9.99999 15.1715Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Bad Examples */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl" dir="rtl">
                <div className="rounded-lg size-8 flex items-center justify-center bg-red-500 text-white shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="size-4">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.81246 3.81246C4.00772 3.6172 4.32431 3.6172 4.51957 3.81246L9.99935 9.29224L15.4791 3.81246C15.6744 3.6172 15.991 3.6172 16.1862 3.81246C16.3815 4.00772 16.3815 4.32431 16.1862 4.51957L10.7065 9.99935L16.1862 15.4791C16.3815 15.6744 16.3815 15.991 16.1862 16.1862C15.991 16.3815 15.6744 16.3815 15.4791 16.1862L9.99935 10.7065L4.51957 16.1862C4.32431 16.3815 4.00772 16.3815 3.81246 16.1862C3.6172 15.991 3.6172 15.6744 3.81246 15.4791L9.29224 9.99935L3.81246 4.51957C3.6172 4.32431 3.6172 4.00772 3.81246 3.81246Z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm uppercase mb-1 text-neutral-900 dark:text-neutral-100">
                    הימנעו מסוגי תמונות אלה
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    ללא כפילויות, צילומי קבוצה, חיות מחמד, עירום, פילטרים, אביזרים המכסים פנים או מסכות
                  </p>
                </div>
              </div>

              {/* Bad Examples */}
              <div className="grid grid-cols-5 gap-2">
                {['Characters Bad 01.webp', 'Characters Bad 02.webp', 'Characters Bad 03.webp', 'Characters Bad 04.webp', 'Characters Bad 05.webp'].map((img, i) => (
                  <div key={i} className="relative aspect-[0.8] rounded-lg overflow-hidden border-2 border-white">
                    <Image
                      src={`/assets/characters/${img}`}
                      alt={`Bad example ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 rounded-lg size-6 flex items-center justify-center bg-red-500 text-white">
                      <svg width="16" height="16" viewBox="0 0 20 20" className="size-3">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3.81246 3.81246C4.00772 3.6172 4.32431 3.6172 4.51957 3.81246L9.99935 9.29224L15.4791 3.81246C15.6744 3.6172 15.991 3.6172 16.1862 3.81246C16.3815 4.00772 16.3815 4.32431 16.1862 4.51957L10.7065 9.99935L16.1862 15.4791C16.3815 15.6744 16.3815 15.991 16.1862 16.1862C15.991 16.3815 15.6744 16.3815 15.4791 16.1862L9.99935 10.7065L4.51957 16.1862C4.32431 16.3815 4.00772 16.3815 3.81246 16.1862C3.6172 15.991 3.6172 15.6744 3.81246 15.4791L9.29224 9.99935L3.81246 4.51957C3.6172 4.32431 3.6172 4.00772 3.81246 3.81246Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File Upload Component - Only show when upload mode is selected */}
            {uploadMode === 'upload' && (
              <div className="w-full">
                <FileUpload onChange={handleFileUpload} value={uploadedFiles} />
              </div>
            )}
          </ModalContent>
          <ModalFooter className="gap-4" dir="rtl">
            <SaveButton />
          </ModalFooter>
        </ModalBody>
      </Modal>

      <div className="absolute inset-0 flex items-center rounded-full pointer-events-none">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              initial={{
                y: 5,
                opacity: 0,
              }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -15,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
              className="dark:text-zinc-500 text-base md:text-lg font-normal text-neutral-500 pr-24 text-right w-[calc(100%-2rem)] truncate"
              dir="rtl"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
