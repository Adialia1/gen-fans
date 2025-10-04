"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { landingStyles, sectionStyles } from './utils/landingStyles';

const faqs = [
  {
    id: 1,
    question: "איך עובד תהליך יצירת התמונות ב-AI?",
    answer: "אתם בוחרים דוגמנית מקטלוג הדוגמניות שלנו או יוצרים דוגמנית חדשה, מגדירים את הסגנון והתפאורה הרצויים, והמערכת שלנו מייצרת תמונות ריאליסטיות תוך דקות. כל התמונות נראות כמו צילום מקצועי אמיתי עם פרטים מושלמים."
  },
  {
    id: 2,
    question: "כמה זמן לקח לקבל את התמונות שיצרתי?",
    answer: "יצירת דוגמנית חדשה לוקחת כ-30 דקות. לאחר מכן, יצירת תמונות נוספות עם אותה דוגמנית לוקחת רק 2-3 דקות לכל תמונה. אם אתם בוחרים דוגמנית מהקטלוג - התמונות מוכנות תוך דקות בודדות!"
  },
  {
    id: 3,
    question: "אילו סגנונות ותפאורות אני יכול לבחור?",
    answer: "יש לנו מגוון עצום של אפשרויות: חוף ים, חדר שינה, סטודיו, טבע, עיר, ועוד. בנוסף, ניתן להוסיף סגנונות לבוש שונים, תאורות מיוחדות, ותנוחות מגוונות. אפשר גם לשלב בין הפריסטים שלנו לרעיונות משלכם."
  },
  {
    id: 4,
    question: "כמה מהר אני יכול לקבל תמונות חדשות אחרי שהעליתי תמונות?",
    answer: "אם אתם יוצרים דוגמנית חדשה - כ-30 דקות להכשרת המודל. אחר כך כל תמונה נוספת לוקחת 2-3 דקות בלבד. אם אתם משתמשים בדוגמנית קיימת מהקטלוג - התמונות מוכנות מיידית!"
  },
  {
    id: 5,
    question: "האם אני יכול לשלב בין הפריסטים שלכם לרעיונות משלי?",
    answer: "בהחלט! אתם יכולים לבחור פריסט בסיסי ולהוסיף לו הנחיות משלכם - תיאורי תלבושת, תנוחה, תאורה, רקע ועוד. המערכת שלנו גמישה מאוד ומאפשרת התאמה אישית מלאה."
  },
  {
    id: 6,
    question: "האם אני צריך ציוד מיוחד, תאורה או מצלמה כדי להתחיל?",
    answer: "בכלל לא! זה היופי של AI - אתם לא צריכים שום ציוד צילום. אם אתם יוצרים דוגמנית חדשה, מספיקות כמה תמונות רגילות. אם אתם בוחרים מהקטלוג - לא צריך אפילו את זה!"
  },
  {
    id: 7,
    question: "מה קורה אם אני לא מרוצה מהתמונות שיצרתי?",
    answer: "אתם יכולים לשכלל את הדוגמנית עם הוראות נוספות, לשנות את הסגנון, התפאורה או התנוחות. המערכת מאפשרת יצירה ללא הגבלה עם הקרדיטים שלכם, כך שתמיד תוכלו ליצור תמונות חדשות עד שתהיו מרוצים."
  },
  {
    id: 8,
    question: "האם אני יכול להשתמש בתמונות למטרות מסחריות כמו OnlyFans או אינסטגרם?",
    answer: "כן! כל התמונות שאתם יוצרים הן שלכם לשימוש מסחרי מלא. אתם יכולים למכור אותן ב-OnlyFans, אינסטגרם, או כל פלטפורמה אחרת ללא כל הגבלה."
  },
  {
    id: 9,
    question: "האם התמונות בטוחות גם לשימוש אישי?",
    answer: "בהחלט! התמונות מושלמות לכל שימוש - אישי או מסחרי. אתם יכולים להשתמש בהן לרשתות חברתיות, אתרים אישיים, תיק עבודות, או כל מטרה אחרת."
  },
  {
    id: 10,
    question: "האם התמונות והנתונים שלי נשמרים בצורה פרטית ומאובטחת?",
    answer: "כן, אנחנו מתייחסים לפרטיות בכובד ראש. כל התמונות והמודלים שלכם מוצפנים ומאוחסנים בצורה מאובטחת. אנחנו לעולם לא חולקים או משתמשים בתוכן שלכם לכל מטרה אחרת."
  },
  {
    id: 11,
    question: "האם אני יכול למחוק את המודל ואת התמונות שהעליתי מאוחר יותר?",
    answer: "כמובן! אתם שולטים לגמרי על התוכן שלכם. אתם יכולים למחוק מודלים, תמונות או כל תוכן אחר בכל עת מהחשבון שלכם."
  },
  {
    id: 12,
    question: "כמה פעמים אני יכול ליצור תמונות אחרי שהמודל אומן?",
    answer: "ללא הגבלה! אחרי שהמודל מאומן, אתם יכולים ליצור כמה תמונות שרק תרצו - המגבלה היחידה היא כמות הקרדיטים בתוכנית שלכם. כל תמונה עולה קרדיטים בודדים בלבד."
  },
  {
    id: 13,
    question: "האם המערכת עובדת גם לגברים וגם לנשים?",
    answer: "בהחלט! המערכת שלנו מתמחה ביצירת דוגמניות נשים ריאליסטיות, שזה בדיוק מה שהשוק של OnlyFans ואינסטגרם מחפש. הטכנולוגיה שלנו מותאמת במיוחד לכך."
  },
  {
    id: 14,
    question: "האם אני יכול ליצור תמונות עבור מישהו אחר?",
    answer: "כן, אתם יכולים ליצור דוגמניות ותמונות עבור לקוחות או שותפים עסקיים. זה מושלם למי שרוצה להפעיל עסק של יצירת תוכן ל-OnlyFans או אינסטגרם."
  },
  {
    id: 15,
    question: "יש לי עוד שאלות או שאני צריך עזרה, איך אני יוצר קשר?",
    answer: "אנחנו כאן כדי לעזור! אתם יכולים לפנות אלינו במייל support@genfans.com או דרך צ'אט התמיכה באתר. אנחנו עונים בדרך כלל תוך מספר שעות."
  }
];

export const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const router = useRouter();

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <section className="py-24 bg-gradient-to-b from-white to-[#F8F9FF]">
      <div className="container">
        <div className={sectionStyles.heading}>
          <div className="flex justify-center">
            <div className={landingStyles.tag}>FAQ</div>
          </div>

          <h2 className={`${sectionStyles.title} mt-5`}>
            שאלות נפוצות
          </h2>
          <p className={`${sectionStyles.description} mt-5`}>
            כל מה שצריך לדעת על יצירת תמונות AI. עדיין יש שאלות?{' '}
            <a
              href="mailto:support@genfans.com"
              className="text-[#fb6f92] hover:text-[#ff8fab] transition-colors underline"
            >
              אנחנו כאן לעזור
            </a>
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          {faqs.map((faq, index) => {
            const isOpen = openItems.includes(faq.id);
            return (
              <motion.div 
                key={faq.id} 
                className="border-b border-gray-200 last:border-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <button
                  className="w-full py-6 flex items-center justify-between text-left hover:text-[#fb6f92] transition-colors group"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                >
                  <h3 className="text-lg font-medium text-[#010D3E] group-hover:text-[#fb6f92] transition-colors pr-8">
                    {faq.question}
                  </h3>
                  <motion.div 
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F8F9FF] group-hover:bg-[#fb6f92]/10 flex items-center justify-center transition-colors"
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus className="w-5 h-5 text-[#fb6f92]" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-[#010D3E]/60 leading-relaxed pb-6">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-[#010D3E]/60 mb-6 text-lg">
            מוכנים להתחיל ליצור תמונות מדהימות?
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="bg-gradient-to-r from-[#fb6f92] to-[#ff8fab] text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 inline-flex items-center justify-center tracking-tight"
          >
            התחילו עכשיו בחינם
          </button>
        </motion.div>
      </div>
    </section>
  );
};