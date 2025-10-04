'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Trash2, User } from 'lucide-react';
import { updateAccount, updatePassword, deleteAccount } from '@/app/(login)/actions';
import { User as UserType } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
        <GeneralSettings />
      </Suspense>

      <SecuritySettings />
    </section>
  );
}
