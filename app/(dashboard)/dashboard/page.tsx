"use client";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { BlurFade } from "@/components/ui/blur-fade";
import { motion } from "motion/react";
import { useState } from "react";

export default function DashboardPage() {
  const placeholders = [
    "צור תמונות AI מדהימות",
    "צור סרטוני AI מקצועיים",
    "החלף פנים בתמונות",
    "בנה מודלים מותאמים אישית",
    "הפוך את הרעיונות שלך למציאות",
  ];

  // Generate placeholder images for history gallery
  const images = Array.from({ length: 9 }, (_, i) => {
    const isLandscape = i % 2 === 0;
    const width = isLandscape ? 800 : 600;
    const height = isLandscape ? 600 : 800;
    return `https://picsum.photos/seed/${i + 1}/${width}/${height}`;
  });

  // Modal state management
  const [selectedType, setSelectedType] = useState<'image' | 'video'>('image');
  const [uploadMode, setUploadMode] = useState<'upload' | 'premade'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted", {
      selectedType,
      uploadMode,
      uploadedFiles,
      selectedCharacter,
    });
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-10 dark:border-neutral-700 dark:bg-neutral-900 pt-20 md:pt-32">
      <motion.div className="relative mx-4 mb-12 md:mb-20 flex flex-col items-center justify-center gap-6 text-center sm:mx-0 sm:flex-row" dir="rtl">
        <LayoutTextFlip
          text="!ברוכים הבאים! מה תרצו ליצור "
          words={["תמונות AI", "סרטוני AI", "החלפת פנים", "מודלים מותאמים"]}
          duration={2500}
        />
      </motion.div>

      <div className="w-full max-w-4xl px-4">
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleChange}
          onSubmit={onSubmit}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          uploadMode={uploadMode}
          onUploadModeChange={setUploadMode}
          uploadedFiles={uploadedFiles}
          onFilesChange={setUploadedFiles}
          selectedCharacter={selectedCharacter}
          onCharacterChange={setSelectedCharacter}
        />
      </div>

      <p
        className="mt-12 text-center text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl px-4"
        dir="rtl"
        style={{
          fontFamily: '"Noto Sans Hebrew", "Noto Sans Hebrew Fallback", Arial, Helvetica, sans-serif',
          fontWeight: 500
        }}
      >
        צרו תוכן מדהים באמצעות בינת מלאכותית עם GenFans. בחרו מה תרצו ליצור והתחילו עכשיו.
      </p>

      {/* Generation History Gallery */}
      <section id="generation-history" className="w-full max-w-6xl px-4 mt-16 md:mt-24">
        <h2
          className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8 text-center"
          dir="rtl"
          style={{
            fontFamily: '"Noto Sans Hebrew", "Noto Sans Hebrew Fallback", Arial, Helvetica, sans-serif',
          }}
        >
          היסטוריית יצירות
        </h2>
        <div className="columns-2 gap-4 sm:columns-3">
          {images.map((imageUrl, idx) => (
            <BlurFade key={imageUrl} delay={0.25 + idx * 0.05} inView>
              <img
                className="mb-4 size-full rounded-lg object-contain"
                src={imageUrl}
                alt={`Generated image ${idx + 1}`}
              />
            </BlurFade>
          ))}
        </div>
      </section>
    </div>
  );
}
