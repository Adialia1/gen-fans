import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
  value = [],
}: {
  onChange?: (files: File[]) => void;
  value?: File[];
}) => {
  const [files, setFiles] = useState<File[]>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with parent value prop
  useEffect(() => {
    setFiles(value);
  }, [value]);

  const handleFileChange = (newFiles: File[]) => {
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onChange && onChange(updatedFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onChange && onChange(updatedFiles);
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
          accept="image/*"
          multiple
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base" dir="rtl">
            העלאת תמונות
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2" dir="rtl">
            גרור ושחרר את התמונות כאן או לחץ להעלאה
          </p>

          {/* Image Previews Grid */}
          {files.length > 0 && (
            <div className="relative w-full mt-6 max-w-xl mx-auto">
              <div className="grid grid-cols-5 gap-2">
                {files.map((file, idx) => (
                  <motion.div
                    key={"file" + idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-[0.8] rounded-lg overflow-hidden border-2 border-white shadow-md"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="absolute top-1 right-1 rounded-full size-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" className="size-3">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3.81246 3.81246C4.00772 3.6172 4.32431 3.6172 4.51957 3.81246L9.99935 9.29224L15.4791 3.81246C15.6744 3.6172 15.991 3.6172 16.1862 3.81246C16.3815 4.00772 16.3815 4.32431 16.1862 4.51957L10.7065 9.99935L16.1862 15.4791C16.3815 15.6744 16.3815 15.991 16.1862 16.1862C15.991 16.3815 15.6744 16.3815 15.4791 16.1862L9.99935 10.7065L4.51957 16.1862C4.32431 16.3815 4.00772 16.3815 3.81246 16.1862C3.6172 15.991 3.6172 15.6744 3.81246 15.4791L9.29224 9.99935L3.81246 4.51957C3.6172 4.32431 3.6172 4.00772 3.81246 3.81246Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-neutral-600 flex flex-col items-center"
                    dir="rtl"
                  >
                    שחרר כאן
                    <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </motion.p>
                ) : (
                  <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
