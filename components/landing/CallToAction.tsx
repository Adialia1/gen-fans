"use client";
import starImage from "@/components/landing/assets/star.png";
import springImage from "@/components/landing/assets/spring.png";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

// Arrow icon as inline SVG component
const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CallToAction = () => {
  const sectionRef = useRef(null);
  const router = useRouter();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  const benefits = [
    "תמונות ריאליסטיות כמו צילום מקצועי אמיתי",
    "יצירה מהירה - דקות במקום ימים של צילומים",
    "חסכון אדיר - ללא צלמים, ציוד או דוגמניות",
    "התחל להרוויח תוך 30 דקות"
  ];

  return (
    <section ref={sectionRef} className="bg-gradient-to-b from-white to-[#ffe5ec] py-24 overflow-x-clip">
      <div className="container">
        <div className="max-w-[800px] mx-auto relative">
          <h2 className="text-center text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter">
            מוכנים להתחיל להרוויח מ{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[#fb6f92] via-[#ff8fab] to-[#ffb3c6] text-transparent bg-clip-text font-bold">
                תמונות AI ריאליסטיות
              </span>
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-[#fb6f92]/20 via-[#ff8fab]/20 to-[#ffb3c6]/20 blur-xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </span>
            ?
          </h2>
          
          <div className="flex flex-col items-center gap-4 mt-8">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="text-[#010D3E]/70 text-base">
                  {benefit}
                </span>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-8 text-[#010D3E]/50 text-base max-w-[500px] mx-auto">
            צרו תמונות מדהימות ל-OnlyFans ואינסטגרם והתחילו להרוויח כבר היום!
          </p>

          <motion.img
            src={starImage.src}
            alt="star image"
            width={360}
            className="absolute -left-[350px] -top-[137px] hidden lg:block"
            style={{
              translateY,
            }}
          />
          <motion.img
            src={springImage.src}
            alt="spring image"
            width={360}
            className="absolute -right-[331px] -top-[19px] hidden lg:block"
            style={{
              translateY,
            }}
          />
        </div>

        <div className="flex justify-center mt-10">
          <motion.button
            onClick={() => router.push('/sign-in')}
            className="relative inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-2xl overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#fb6f92] via-[#ff8fab] to-[#fb6f92] bg-[size:200%_100%] animate-shine" />
            <span className="relative flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              צרו את הדוגמנית הראשונה שלכם עכשיו
            </span>
          </motion.button>
        </div>
      </div>
    </section>
  );
};
