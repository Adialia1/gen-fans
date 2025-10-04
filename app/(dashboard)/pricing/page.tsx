'use client';

import { checkoutAction } from '@/lib/payments/actions';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';

// Hardcoded Price IDs from Stripe
const PRICING = {
  starter: {
    monthly: 'price_1SEUIfGdkOzJpVhp0pNa8V0u',
    yearly: 'price_1SEUIfGdkOzJpVhpHR9lHsGT',
  },
  ultra: {
    monthly: 'price_1SEUIgGdkOzJpVhplTm9nfJL',
    yearly: 'price_1SEUIgGdkOzJpVhpC5JBUO9f',
  },
};

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] bg-clip-text text-transparent mb-4">בחרו את התוכנית שלכם</h1>
        <p className="text-lg text-gray-600 mb-8">תמחור פשוט ושקוף ליצירת תוכן באמצעות AI</p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${billingInterval === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
            שנתי <span className="text-[#fb6f92]">(חסכו 25%)</span>
          </span>
          <button
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors"
            style={{
              backgroundColor: billingInterval === 'monthly' ? '#fb6f92' : '#e5e7eb'
            }}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                billingInterval === 'monthly' ? 'translate-x-1' : 'translate-x-8'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            חודשי
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <PricingCard
          name="מתחילים"
          monthlyPrice={40}
          yearlyPrice={30}
          billingInterval={billingInterval}
          credits={315}
          features={[
            '315 קרדיטים לחודש',
            'עד 300 תמונות AI',
            'עד 3 סרטונים (5 שניות)',
            'תור עיבוד רגיל',
            'תמיכה במייל',
            'זכויות שימוש מסחרי',
          ]}
          priceId={PRICING.starter[billingInterval]}
          popular={false}
        />
        <PricingCard
          name="אולטרה"
          monthlyPrice={299}
          yearlyPrice={250}
          billingInterval={billingInterval}
          credits={1750}
          features={[
            '1,750 קרדיטים לחודש',
            'עד 1,000 תמונות AI',
            'עד 150 סרטונים (5 שניות)',
            'עיבוד מיידי (עדיפות)',
            'תמיכה עדיפות',
            'זכויות שימוש מסחרי',
            'מודלים מתקדמים של AI',
          ]}
          priceId={PRICING.ultra[billingInterval]}
          popular={true}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  monthlyPrice,
  yearlyPrice,
  billingInterval,
  credits,
  features,
  priceId,
  popular,
}: {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  billingInterval: 'monthly' | 'yearly';
  credits: number;
  features: string[];
  priceId?: string;
  popular?: boolean;
}) {
  const displayPrice = billingInterval === 'monthly' ? monthlyPrice : yearlyPrice;
  const yearlyTotal = yearlyPrice * 12;

  return (
    <div className={`relative pt-6 pb-8 px-6 rounded-2xl border-2 ${
      popular ? 'border-[#fb6f92] shadow-xl' : 'border-gray-200'
    }`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-[#fb6f92] text-white px-4 py-1 rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            הכי פופולרי
          </span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">{credits} קרדיטים/חודש</p>

      <div className="mb-6">
        <p className="text-5xl font-bold text-gray-900">
          ${displayPrice}
          <span className="text-xl font-normal text-gray-600">
            /חודש
          </span>
        </p>
        {billingInterval === 'yearly' && (
          <p className="text-sm text-gray-500 mt-1">
            ${yearlyTotal}/שנה (חיוב שנתי)
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className={`h-5 w-5 ${popular ? 'text-[#fb6f92]' : 'text-gray-400'} ml-3 mt-0.5 flex-shrink-0`} />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <button
          type="submit"
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
            popular
              ? 'bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] text-white hover:from-[#fa5a82] hover:to-[#ff7a9b]'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          התחילו עכשיו
        </button>
      </form>
    </div>
  );
}
