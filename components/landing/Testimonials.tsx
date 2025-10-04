"use client";
import avatar1 from "@/components/landing/assets/avatar-1.png";
import avatar2 from "@/components/landing/assets/avatar-2.png";
import avatar3 from "@/components/landing/assets/avatar-3.png";
import avatar4 from "@/components/landing/assets/avatar-4.png";
import avatar5 from "@/components/landing/assets/avatar-5.png";
import avatar6 from "@/components/landing/assets/avatar-6.png";
import avatar7 from "@/components/landing/assets/avatar-7.png";
import avatar8 from "@/components/landing/assets/avatar-8.png";
import avatar9 from "@/components/landing/assets/avatar-9.png";
import Image from "next/image";
import React, { use } from "react";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "בחודש הראשון עשיתי 8,000$ מתמונות AI באינסטגרם! התמונות נראות כל כך אמיתיות שאף אחד לא מבין שזה AI. המנויים שלי גדלו פי 3 ואני חוסכת שעות על צילומים ועריכה.",
    imageSrc: avatar1.src,
    name: "נועה כהן",
    username: "מוכרת תמונות AI באינסטגרם",
  },
  {
    text: "OnlyFans שלי מרוויח עכשיו 15,000$ לחודש! יצרתי דוגמנית מושלמת עם AI והיא נראית יותר טוב מתמונות אמיתיות. המנויים מתלהבים והתוכן יוצא מהיר ובאיכות מטורפת.",
    imageSrc: avatar2.src,
    name: "דניאל לוי",
    username: "מוכר תוכן AI ב-OnlyFans",
  },
  {
    text: "לא האמנתי שזה יעבוד אבל התוצאות מדהימות. התמונות נראות כמו צילום מקצועי ממש, כל הפרטים מושלמים. עשיתי 12,000$ בשבועיים הראשונים באינסטגרם.",
    imageSrc: avatar3.src,
    name: "מיכל אברהם",
    username: "מנהלת חשבון AI באינסטגרם",
  },
  {
    text: "החיסכון בזמן פשוט משגע - מה שלקח לי שבוע שלם של צילומים עכשיו לוקח 30 דקות. התוכן שלי ב-OnlyFans הפך למקצועי פי 10 וההכנסות קפצו ל-20,000$ לחודש.",
    imageSrc: avatar4.src,
    name: "רון שפירא",
    username: "מנהל תוכן AI ב-OnlyFans",
  },
  {
    text: "התמונות של ה-AI נראות יותר טוב מהצלמת שהיתה לי! יצרתי דוגמנית מושלמת והמנויים שלי באינסטגרם פשוט התפוצצו. עשיתי 25,000$ בחודש הראשון בלי להוציא שקל על צילומים.",
    imageSrc: avatar5.src,
    name: "שרון מזרחי",
    username: "מוכרת דוגמניות AI",
  },
  {
    text: "ניסיתי כלים אחרים אבל שום דבר לא התקרב לרמה הזו. התמונות נראות ממש אמיתיות, כל הפרופורציות מדויקות והתאורה מושלמת. המנויים שלי זינקו ל-50,000 עוקבים בחודשיים.",
    imageSrc: avatar6.src,
    name: "עומר ברק",
    username: "יזם תוכן AI",
  },
  {
    text: "ההכנסות שלי מ-OnlyFans עלו מ-3,000$ ל-18,000$ לחודש! הסוד הוא באיכות התמונות - הן נראות כמו מגזין אופנה מקצועי. אף אחד לא מאמין שזה AI.",
    imageSrc: avatar7.src,
    name: "ליאת גולן",
    username: "מנהלת תוכן AI ב-OnlyFans",
  },
  {
    text: "פשוט מטורף כמה זמן חסכתי. במקום לבזבז ימים על צילומים, אני יוצר תוכן מושלם בדקות. האינסטגרם שלי צמח ל-100,000 עוקבים והמכירות עלו פי 5.",
    imageSrc: avatar8.src,
    name: "יוסי פרידמן",
    username: "סוחר תמונות AI",
  },
  {
    text: "התמונות כל כך ריאליסטיות שהמתחרים שלי חושבים שיש לי צלם מקצועי. ה-OnlyFans שלי מרוויח עכשיו 30,000$ לחודש והכל בזכות האיכות המטורפת של התמונות מ-AI.",
    imageSrc: avatar9.src,
    name: "טל רוזנברג",
    username: "בעלת עסק תוכן AI",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, imageSrc, name, username }) => (
                <div className="p-10 rounded-3xl border border-[#F1F1F1] shadow-[0_7px_14px_#EAEAEA] max-w-xs w-full bg-white" key={username}>
                  <div className="text-base text-gray-600 text-right">{text}</div>
                  <div className="mt-5">
                    <div className="font-medium tracking-tight leading-5">{name}</div>
                    <div className="leading-5 tracking-tight text-sm text-gray-500">{username}</div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

export const Testimonials = () => {
  return (
    <section className="bg-white" dir="rtl">
      <div className="container">
        <div className="max-w-[540px] mx-auto">
          <div className="flex justify-center">
            <div className="text-sm inline-flex border border-[#fb6f92]/30 bg-[#fff0f3] px-3 py-1 rounded-lg tracking-tight text-[#fb6f92]">סיפורי הצלחה אמיתיים</div>
          </div>

          <h2 className="text-center text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter mt-5">
            <span className="text-black">מה יוצרי התוכן</span>
            <br />
            <span className="text-black">שלנו</span>
            <br />
            <span className="bg-gradient-to-r from-[#fb6f92] to-[#ff8fab] text-transparent bg-clip-text">
              מרוויחים בפועל
            </span>
          </h2>
          <p className="text-center text-[22px] leading-[30px] tracking-tight text-[#010D3E] mt-5">
            גלו איך יוצרים מרוויחים אלפי דולרים בחודש עם תמונות AI ריאליסטיות ל-OnlyFans ואינסטגרם
          </p>
        </div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};
