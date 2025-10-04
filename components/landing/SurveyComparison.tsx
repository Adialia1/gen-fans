"use client";
import pyramidImage from "@/components/landing/assets/pyramid.png";
import tubeImage from "@/components/landing/assets/tube.png";
import { MagicCard } from "@/components/landing/ui/magic-card";
import { RainbowButton } from "@/components/landing/ui/rainbow-button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";

export const SurveyComparison = () => {
  const sectionRef = useRef(null);
  const router = useRouter();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <section ref={sectionRef} className="bg-gradient-to-b from-[#ffe5ec] to-[#FFFFFF] py-24 overflow-x-clip relative">
      <div className="container">
        {/* Header Section */}
        <div className="max-w-[700px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="text-sm inline-flex border border-[#ffb3c6]/30 bg-[#F3F0FF] px-3 py-1 rounded-lg tracking-tight text-[#fb6f92]">השוואת עלויות</div>
          </div>

          <h2 className="text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter mt-5">
            <span className="text-black">בואו נהיה כנים לגבי</span>
            <br />
            <span className="bg-gradient-to-r from-[#ff8fab] to-[#ffc2d1] text-transparent bg-clip-text">
              עלויות הצילום הנוכחיות שלכם
            </span>
          </h2>

          <p className="section-des mt-5 max-w-[600px] mx-auto">
            מצלמים מקצועיים, אולפני צילום, עריכה, והכל רק כדי לייצר תמונות למדיה החברתית.
            אלפי שקלים לכל סשן, שעות של עבודה עבור תוכן שהיה יכול להיות מוכן תוך דקות.
          </p>

          <p className="text-base mt-4" style={{ color: "#ff8fab" }}>
            מודל AI אחד יוצר אינסוף תמונות מקצועיות בו-זמנית.
          </p>
        </div>

        {/* Comparison Cards with Magic Card */}
        <div className="grid md:grid-cols-2 gap-8 mt-16 max-w-4xl mx-auto relative">
          {/* Traditional Photography - Problem Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="magic-card-wrapper"
          >
            <MagicCard
              className="h-full cursor-default rounded-3xl"
              gradientSize={150}
              gradientColor="#DC2626"
              gradientFrom="#DC2626"
              gradientTo="#EF4444"
              gradientOpacity={0.05}
            >
              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-red-600 mb-2">
                    צילום מסורתי
                  </h3>
                  <p className="text-xs text-gray-500 italic">
                    מצלמים, אולפנים וסטודיו
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    "₪5,000-₪15,000 לכל סשן צילום",
                    "תיאום מורכב עם צלמים ודוגמניות",
                    "מוגבל למיקום ותנאי תאורה",
                    "שבועות עד לתמונות מעובדות",
                    "תוכן מוגבל - פעם אחת בלבד"
                  ].map((text, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-[#010D3E]/80">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </MagicCard>
          </motion.div>

          {/* AI Generation - Solution Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative magic-card-wrapper"
          >
            {/* Solution Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
              <span className="bg-gradient-to-r from-[#fb6f92] to-[#ff8fab] text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                הפתרון
              </span>
            </div>

            <MagicCard
              className="h-full cursor-default rounded-3xl"
              gradientSize={150}
              gradientColor="#fb6f92"
              gradientFrom="#fb6f92"
              gradientTo="#ff8fab"
              gradientOpacity={0.05}
            >
              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-[#fb6f92] to-[#ff8fab] text-transparent bg-clip-text">
                    יצירה באמצעות AI
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    "₪29/חודש - תמונות ללא הגבלה",
                    "2 דקות ליצירת מודל AI מושלם",
                    "כל תנוחה, תלבושת ומיקום שתרצו",
                    "תוכן מוכן לפרסום באינסטגרם",
                    "100% שליטה על הדוגמנית והסגנון"
                  ].map((text, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[#010D3E]/80">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </MagicCard>
          </motion.div>
        </div>

        {/* CTA Section with Rainbow Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex justify-center items-center mt-16 px-4"
        >
          <motion.div
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <RainbowButton
              size="lg"
              className="font-semibold transition-shadow hover:shadow-lg"
              onClick={() => router.push('/auth/signup')}
              style={{
                background: 'linear-gradient(90deg, #fb6f92, #ff8fab, #fb6f92, #ff8fab, #fb6f92)',
                backgroundSize: '200% 100%',
                animation: 'rainbow 3s infinite linear',
                color: 'white',
                border: 'none'
              }}
            >
              <span className="flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base whitespace-nowrap text-white">
                צרו את הדוגמנית שלכם עכשיו
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </span>
            </RainbowButton>
          </motion.div>
        </motion.div>

        {/* Decorative Images */}
        <motion.img
          src={pyramidImage.src}
          alt="Pyramid decoration"
          height={200}
          width={200}
          className="hidden md:block absolute -right-20 top-40 opacity-30"
          style={{
            translateY: translateY,
          }}
        />
        <motion.img
          src={tubeImage.src}
          alt="Tube decoration"
          height={200}
          width={200}
          className="hidden md:block absolute -left-20 bottom-40 opacity-30"
          style={{
            translateY: translateY,
          }}
        />
      </div>
    </section>
  );
};