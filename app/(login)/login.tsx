'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-white to-pink-50" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/assets/images/logo.png"
            alt="GenFans"
            width={80}
            height={80}
            className="h-20 w-20"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] bg-clip-text text-transparent">
          {mode === 'signin'
            ? 'התחברו לחשבון שלכם'
            : 'צרו את החשבון שלכם'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'signin'
            ? 'התחילו ליצור תמונות AI מדהימות'
            : 'הצטרפו לאלפי יוצרים מצליחים'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-pink-100">
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 text-right"
              >
                אימייל
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.email}
                  required
                  maxLength={50}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fb6f92] focus:border-transparent sm:text-sm text-right"
                  placeholder="הזינו את האימייל שלכם"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 text-right"
              >
                סיסמה
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  defaultValue={state.password}
                  required
                  minLength={8}
                  maxLength={100}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fb6f92] focus:border-transparent sm:text-sm text-right"
                  placeholder="לפחות 8 תווים"
                  dir="ltr"
                />
              </div>
            </div>

            {state?.error && (
              <div className="text-red-500 text-sm text-right bg-red-50 p-3 rounded-lg border border-red-200">
                {state.error === 'Invalid credentials' ? 'פרטי התחברות שגויים' :
                 state.error === 'Email already exists' ? 'האימייל כבר קיים במערכת' :
                 state.error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-l from-[#fb6f92] to-[#ff8fab] hover:from-[#fa5a82] hover:to-[#ff7a9b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fb6f92] transition-all duration-200"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin ml-2 h-4 w-4" />
                    טוען...
                  </>
                ) : mode === 'signin' ? (
                  'התחברות'
                ) : (
                  'הרשמה'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  {mode === 'signin'
                    ? 'חדשים בפלטפורמה?'
                    : 'כבר יש לכם חשבון?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                  redirect ? `?redirect=${redirect}` : ''
                }${priceId ? `&priceId=${priceId}` : ''}`}
                className="w-full flex justify-center py-3 px-4 border border-pink-200 rounded-lg shadow-sm text-sm font-medium text-[#fb6f92] bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fb6f92] transition-all duration-200"
              >
                {mode === 'signin'
                  ? 'צרו חשבון חדש'
                  : 'התחברו לחשבון קיים'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
