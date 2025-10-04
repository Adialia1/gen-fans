"use client";
import { Cobe } from "@/components/landing/eldoraui/cobe";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import springImage from "@/components/landing/assets/spring.png";
import starImage from "@/components/landing/assets/star.png";

export const GlobalReach = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <section ref={sectionRef} className="bg-gradient-to-b from-[#ffe5ec] to-[#FFFFFF] py-24 overflow-x-clip">
      <div className="container">
        <div className="max-w-[540px] mx-auto">
          <div className="flex justify-center">
            <div className="tag">קישוריות גלובלית</div>
          </div>

          <h2 className="text-center text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter bg-gradient-to-b from-black to-[#001E80] text-transparent bg-clip-text mt-5">
            הגיעו ללקוחות ברחבי העולם עם תמיכה בריבוי שפות
          </h2>
          <p className="section-des mt-5">
            שברו מחסומי שפה והרחיבו את העסק שלכם גלובלית עם תמיכה מובנית ברב-שפות,
            הגעה ללקוחות בשפת האם שלהם בכל יבשת.
          </p>
        </div>

        <div className="relative mt-10">
          <div className="relative z-10">
            <Cobe />
          </div>
          
          <motion.img
            src={springImage.src}
            alt="Spring decoration"
            height={200}
            width={200}
            className="hidden md:block absolute -right-24 top-10"
            style={{
              translateY: translateY,
            }}
          />
          <motion.img
            src={starImage.src}
            alt="Star decoration"
            height={220}
            width={220}
            className="hidden md:block absolute -left-32 bottom-10"
            style={{
              translateY: translateY,
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-b from-black to-[#001E80] text-transparent bg-clip-text">
              15+
            </div>
            <p className="text-[#010D3E] mt-2">שפות נתמכות</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-b from-black to-[#001E80] text-transparent bg-clip-text">
              2.5B+
            </div>
            <p className="text-[#010D3E] mt-2">דוברי שפת אם שהושגו</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-b from-black to-[#001E80] text-transparent bg-clip-text">
              95%
            </div>
            <p className="text-[#010D3E] mt-2">כיסוי עסקי גלובלי</p>
          </div>
        </div>
      </div>
    </section>
  );
};