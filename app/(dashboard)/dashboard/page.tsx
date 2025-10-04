'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { TeamDataWithMembers } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import { CreditCard, Sparkles } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CreditBalance = {
  availableCredits: number;
  reservedCredits: number;
  bonusCredits: number;
  totalAllocated: number;
  usedCredits: number;
};

function SubscriptionSkeleton() {
  return (
    <Card className="mb-8 h-[200px] border-pink-100">
      <CardHeader>
        <CardTitle className="text-right">המנוי שלי</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ManageSubscription() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: creditData } = useSWR<CreditBalance>('/api/credits/balance', fetcher);

  const isPremium = teamData?.subscriptionStatus === 'active' || teamData?.subscriptionStatus === 'trialing';
  const isPaymentFailed = teamData?.subscriptionStatus === 'past_due' || teamData?.subscriptionStatus === 'unpaid';

  return (
    <Card className="mb-8 border-pink-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-right flex items-center justify-between">
          <span>המנוי שלי</span>
          <CreditCard className="h-6 w-6 text-[#fb6f92]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Payment Failed Warning */}
          {isPaymentFailed && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                <span className="text-red-800 font-semibold">שגיאה בתשלום</span>
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-red-700 mb-3">
                התשלום שלך נכשל. הקרדיטים שלך אופסו עד שהתשלום יעבור בהצלחה.
              </p>
              <form action={customerPortalAction}>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  עדכן אמצעי תשלום
                </Button>
              </form>
            </div>
          )}

          {/* Current Plan */}
          <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-lg border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <div className="text-right">
                <h3 className="text-2xl font-bold text-gray-900">
                  {teamData?.planName || 'חינם'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {teamData?.subscriptionStatus === 'active'
                    ? 'מנוי פעיל'
                    : teamData?.subscriptionStatus === 'trialing'
                    ? 'תקופת ניסיון'
                    : teamData?.subscriptionStatus === 'past_due'
                    ? 'תשלום באיחור'
                    : teamData?.subscriptionStatus === 'unpaid'
                    ? 'ממתין לתשלום'
                    : 'תוכנית חינם'}
                </p>
              </div>
              {isPremium && (
                <div className="bg-[#fb6f92] text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  פרימיום
                </div>
              )}
            </div>

            {/* Credits Info */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-white rounded-lg border border-pink-100">
                <p className="text-sm text-gray-600">קרדיטים זמינים</p>
                <p className="text-2xl font-bold text-[#fb6f92] mt-1">
                  {creditData?.availableCredits ?? 0}
                </p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-pink-100">
                <p className="text-sm text-gray-600">סה"כ קרדיטים</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {creditData?.totalAllocated ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isPremium ? (
              <form action={customerPortalAction} className="flex-1">
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-pink-200 text-[#fb6f92] hover:bg-pink-50"
                >
                  ניהול מנוי
                </Button>
              </form>
            ) : (
              <Button
                asChild
                className="flex-1 bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] hover:from-[#fa5a82] hover:to-[#ff7a9b] text-white"
              >
                <a href="/pricing">שדרגו למנוי פרימיום</a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStats() {
  const { data: creditData } = useSWR<CreditBalance>('/api/credits/balance', fetcher);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="border-pink-100">
        <CardHeader>
          <CardTitle className="text-right text-sm font-medium text-gray-600">
            תמונות שנוצרו
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-[#fb6f92] text-right">0</p>
        </CardContent>
      </Card>

      <Card className="border-pink-100">
        <CardHeader>
          <CardTitle className="text-right text-sm font-medium text-gray-600">
            מודלים פעילים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-[#fb6f92] text-right">0</p>
        </CardContent>
      </Card>

      <Card className="border-pink-100">
        <CardHeader>
          <CardTitle className="text-right text-sm font-medium text-gray-600">
            קרדיטים זמינים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-[#fb6f92] text-right">
            {creditData?.availableCredits ?? 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-bold mb-6 text-right bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] bg-clip-text text-transparent">
        ברוכים הבאים לדשבורד
      </h1>
      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>

      <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-lg" />}>
        <QuickStats />
      </Suspense>
    </section>
  );
}
