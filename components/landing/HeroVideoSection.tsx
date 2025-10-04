"use client";

import { HeroVideoDialog } from "@/components/landing/ui/hero-video-dialog";
import { motion } from "framer-motion";

export const HeroVideoSection = () => {
  return (
    <section className="bg-gradient-to-b from-white to-[#ffe5ec] py-12 md:py-16 overflow-x-clip">
      <div className="container">
        <div className="max-w-[540px] mx-auto">
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="tag">צפו איך זה עובד</div>
          </motion.div>

          <motion.h2
            className="text-center text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter mt-5"
            style={{ fontFamily: "'GT Walsheim Pro', 'DM Sans', sans-serif", fontWeight: 700 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="text-black">מדוגמנית למודל AI</span>
            <br />
            <span className="bg-gradient-to-r from-[#ff8fab] to-[#fb6f92] text-transparent bg-clip-text">
              תוך 2 דקות
            </span>
          </motion.h2>

          <motion.p
            className="text-center text-[22px] leading-[30px] tracking-tight text-[#010D3E] mt-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            העלו כמה תמונות של הדוגמנית שלכם, ותוך 2 דקות תקבלו מודל AI מלא שמייצר תמונות מקצועיות בכל תנוחה, תלבושת או מיקום שתבחרו.
          </motion.p>
        </div>

        <motion.div 
          className="relative mt-10 md:mt-14 max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <HeroVideoDialog
            className="block"
            animationStyle="from-center"
            videoSrc="https://player.cloudinary.com/embed/?cloud_name=dhp6xwena&public_id=EAyItZth-video_alu2fk&profile=cld-default"
            thumbnailSrc="https://res.cloudinary.com/dhp6xwena/video/upload/so_0,f_jpg,q_auto/EAyItZth-video_alu2fk.jpg"
            thumbnailAlt="Hero Video"
          />
        </motion.div>
      </div>
    </section>
  );
};