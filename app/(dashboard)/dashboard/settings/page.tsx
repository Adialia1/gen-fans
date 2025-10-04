'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Trash2, User, CreditCard, Sparkles } from 'lucide-react';
import { updateAccount, updatePassword, deleteAccount } from '@/app/(login)/actions';
import { customerPortalAction } from '@/lib/payments/actions';
import { User as UserType, TeamDataWithMembers } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CreditBalance = {
  availableCredits: number;
  reservedCredits: number;
  bonusCredits: number;
  totalAllocated: number;
  usedCredits: number;
};

type AccountState = {
  name?: string;
  error?: string;
  success?: string;
};

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

// Subscription & Credits Component
function SubscriptionSettings() {
  const { data: teamData} = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: creditData } = useSWR<CreditBalance>('/api/credits/balance', fetcher);

  const isPremium = teamData?.subscriptionStatus === 'active' || teamData?.subscriptionStatus === 'trialing';
  const isPaymentFailed = teamData?.subscriptionStatus === 'past_due' || teamData?.subscriptionStatus === 'unpaid';

  return (
    <Card className="mb-8 border-pink-100">
      <CardHeader>
        <CardTitle className="text-right flex items-center justify-between">
          <span>מנוי וקרדיטים</span>
          <CreditCard className="h-5 w-5 text-[#fb6f92]" />
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

// General Settings Component
function GeneralSettings() {
  const { data: user } = useSWR<UserType>('/api/user', fetcher);
  const [state, formAction, isPending] = useActionState<AccountState, FormData>(
    updateAccount,
    {}
  );

  return (
    <Card className="mb-8 border-pink-100">
      <CardHeader>
        <CardTitle className="text-right flex items-center justify-between">
          <span>פרטי חשבון</span>
          <User className="h-5 w-5 text-[#fb6f92]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={formAction}>
          <div>
            <Label htmlFor="name" className="mb-2 text-right block">
              שם
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="הזינו את שמכם"
              defaultValue={state.name || user?.name || ''}
              required
              className="text-right focus:ring-[#fb6f92] focus:border-[#fb6f92]"
            />
          </div>
          <div>
            <Label htmlFor="email" className="mb-2 text-right block">
              אימייל
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="הזינו את האימייל שלכם"
              defaultValue={user?.email || ''}
              required
              className="text-right focus:ring-[#fb6f92] focus:border-[#fb6f92]"
              dir="ltr"
            />
          </div>
          {state.error && (
            <p className="text-red-500 text-sm text-right bg-red-50 p-3 rounded-lg">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="text-green-500 text-sm text-right bg-green-50 p-3 rounded-lg">
              {state.success}
            </p>
          )}
          <Button
            type="submit"
            className="bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] hover:from-[#fa5a82] hover:to-[#ff7a9b] text-white w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : (
              'שמור שינויים'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Security Settings Component
function SecuritySettings() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  return (
    <>
      {/* Change Password */}
      <Card className="mb-8 border-pink-100">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>שינוי סיסמה</span>
            <Lock className="h-5 w-5 text-[#fb6f92]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={passwordAction}>
            <div>
              <Label htmlFor="current-password" className="mb-2 text-right block">
                סיסמה נוכחית
              </Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.currentPassword}
                className="text-right focus:ring-[#fb6f92] focus:border-[#fb6f92]"
                dir="ltr"
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="mb-2 text-right block">
                סיסמה חדשה
              </Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.newPassword}
                className="text-right focus:ring-[#fb6f92] focus:border-[#fb6f92]"
                dir="ltr"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="mb-2 text-right block">
                אימות סיסמה חדשה
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.confirmPassword}
                className="text-right focus:ring-[#fb6f92] focus:border-[#fb6f92]"
                dir="ltr"
              />
            </div>
            {passwordState.error && (
              <p className="text-red-500 text-sm text-right bg-red-50 p-3 rounded-lg">
                {passwordState.error}
              </p>
            )}
            {passwordState.success && (
              <p className="text-green-500 text-sm text-right bg-green-50 p-3 rounded-lg">
                {passwordState.success}
              </p>
            )}
            <Button
              type="submit"
              className="bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] hover:from-[#fa5a82] hover:to-[#ff7a9b] text-white w-full"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מעדכן...
                </>
              ) : (
                <>
                  <Lock className="ml-2 h-4 w-4" />
                  עדכן סיסמה
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between text-red-600">
            <span>מחיקת חשבון</span>
            <Trash2 className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4 text-right">
            מחיקת חשבון היא פעולה בלתי הפיכה. אנא המשיכו בזהירות.
          </p>
          <form action={deleteAction} className="space-y-4">
            <div>
              <Label htmlFor="delete-password" className="mb-2 text-right block">
                אשרו את הסיסמה
              </Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={deleteState.password}
                className="text-right focus:ring-red-500 focus:border-red-500"
                dir="ltr"
              />
            </div>
            {deleteState.error && (
              <p className="text-red-500 text-sm text-right bg-red-50 p-3 rounded-lg">
                {deleteState.error}
              </p>
            )}
            <Button
              type="submit"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 w-full"
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מוחק...
                </>
              ) : (
                <>
                  <Trash2 className="ml-2 h-4 w-4" />
                  מחק חשבון
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

export default function SettingsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-bold mb-6 text-right bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] bg-clip-text text-transparent">
        הגדרות
      </h1>

      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg" />}>
        <SubscriptionSettings />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg" />}>
        <GeneralSettings />
      </Suspense>

      <SecuritySettings />
    </section>
  );
}
