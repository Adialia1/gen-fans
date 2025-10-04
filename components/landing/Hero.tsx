"use client";
import cogImage from "@/components/landing/assets/cog.png";
import cylinderImage from "@/components/landing/assets/cylinder.png";
import noodleImage from "@/components/landing/assets/noodle.png";
import { BlurIn } from "@/components/landing/eldoraui/blurin";
import { GradientBlurIn } from "@/components/landing/GradientBlurIn";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const Hero = () => {
  const heroRef = useRef(null);
  const router = useRouter();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <section
      ref={heroRef}
      className="w-full flex justify-center"
      style={{
        backgroundColor: "#ffffff",
        paddingTop: "20px",
      }}
    >
      <div 
        className="w-full relative"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(40px, 8vh, 80px) clamp(16px, 4vw, 240px) clamp(80px, 16vh, 160px)",
          borderRadius: "0px 0px 44px 44px",
          overflow: "hidden",
          // Telmi-style background with grid and gradients
          background: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(255,179,198,0.05) 70%, rgba(251,111,146,0.1) 100%),
            linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 40%, rgba(255,229,236,0.9) 70%, rgba(255,194,209,0.1) 100%),
            radial-gradient(ellipse 200% 100% at bottom left, #fb6f92, #ffe5ec 100%)
          `,
          backgroundSize: "40px 40px, 40px 40px, 100% 100%, 100% 100%, 100% 100%",
          backgroundPosition: "top left, top left, center, center, center",
          backgroundRepeat: "repeat, repeat, no-repeat, no-repeat, no-repeat",
          minHeight: "fit-content"
        }}
      >
        <div className="relative z-10 w-full flex flex-col items-center gap-6">
          {/* Main Heading - Clear and direct */}
          <GradientBlurIn delay={0.1} className="text-center max-w-5xl">
            <h1
              style={{
                fontSize: "clamp(42px, 7vw, 90px)",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
                fontFamily: '"Noto Sans Hebrew", "Noto Sans Hebrew Fallback", Arial, Helvetica, sans-serif',
                fontWeight: 800,
                marginBottom: "24px"
              }}
            >
              <span style={{ color: "#000000" }}>צרו את</span>{" "}
              <span style={{
                background: "linear-gradient(135deg, #fb6f92 0%, #ff8fab 50%, #ffb3c6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                דוגמנית החלומות
              </span>
              <br />
              <span style={{ color: "#000000" }}>שלכם באמצעות AI</span>
            </h1>
          </GradientBlurIn>

          {/* Subheading */}
          <GradientBlurIn delay={0.15} className="text-center max-w-3xl">
            <p
              style={{
                fontSize: "clamp(20px, 2.8vw, 26px)",
                lineHeight: "1.4",
                color: "rgba(0, 0, 0, 0.8)",
                fontFamily: '"Noto Sans Hebrew", "Noto Sans Hebrew Fallback", Arial, Helvetica, sans-serif',
                fontWeight: 500,
                marginBottom: "20px"
              }}
            >
              קבלו תמונות בלעדיות ומושלמות ל-OnlyFans ו-Instagram. ללא מצלמה או דוגמניות.
            </p>
          </GradientBlurIn>

          {/* Features line */}
          {/* <GradientBlurIn delay={0.2} className="text-center">
            <p
              style={{
                fontSize: "clamp(16px, 2.2vw, 19px)",
                color: "rgba(0, 0, 0, 0.7)",
                fontFamily: '"Inter", -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                fontWeight: 500
              }}
            >
              Enterprise-grade AI for small business. No code, no complexity.
            </p>
          </GradientBlurIn> */}



          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '16px'
            }}
          >
            <Link href="/sign-in" className="inline-flex items-center justify-center px-12 py-3 text-lg font-semibold text-white bg-gradient-to-r from-[#fb6f92] to-[#ff8fab] rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
              התחל בחינם
            </Link>
          </motion.div>

        </div>

        {/* CSS for responsive design */}
        <style jsx>{`
          @media (max-width: 768px) {
            .relative {
              padding: clamp(25px, 5vh, 50px) 20px clamp(50px, 10vh, 100px) !important;
            }
            .group {
              border-radius: 12px !important;
            }
            .trust-signal-item {
              flex-direction: column !important;
              gap: clamp(2px, 0.5vw, 4px) !important;
              align-items: center !important;
            }
          }
          
          @media (max-width: 480px) {
            .relative {
              padding: clamp(20px, 4vh, 40px) 16px clamp(40px, 8vh, 80px) !important;
            }
            .trust-signal-item {
              gap: clamp(1px, 0.3vw, 2px) !important;
            }
          }
          
          .trust-signal-item {
            gap: clamp(4px, 1vw, 8px);
          }
          
          .group:hover {
            box-shadow: 0 15px 50px rgba(139, 127, 199, 0.25), 0 5px 15px rgba(0,0,0,0.12) !important;
            border-color: rgba(139, 127, 199, 0.3) !important;
          }
          
          input::placeholder {
            color: rgba(43, 28, 87, 0.4);
          }
        `}</style>

      </div>
    </section>
  );
};