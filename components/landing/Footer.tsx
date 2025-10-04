"use client";
import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
      <div className="container px-4 mx-auto py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block mb-6">
                <Image
                  src="/assets/images/logo.png"
                  alt="GenFans Logo"
                  width={48}
                  height={48}
                  className="hover:opacity-80 transition-opacity"
                />
              </Link>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                GenFans היא פלטפורמת AI מתקדמת ליצירת תמונות ריאליסטיות של דוגמניות. צרו תוכן מקצועי ל-OnlyFans ואינסטגרם תוך דקות - ללא צלמים, ללא ציוד, ללא מגבלות.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">מוצר</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard" className="text-gray-600 hover:text-[#fb6f92] transition-colors text-sm">
                    לוח בקרה
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-600 hover:text-[#fb6f92] transition-colors text-sm">
                    תמחור
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="text-gray-600 hover:text-[#fb6f92] transition-colors text-sm">
                    התחברות
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">יצירת קשר</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:support@genfans.com"
                    className="text-gray-600 hover:text-[#fb6f92] transition-colors text-sm"
                  >
                    support@genfans.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} GenFans™. כל הזכויות שמורות.
              </p>
              <p className="text-gray-400 text-xs text-center">
                יוצרים תמונות AI מדהימות ל-OnlyFans ואינסטגרם
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};