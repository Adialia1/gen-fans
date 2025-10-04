"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { signOut } from "@/app/(login)/actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PricingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const links = [
    {
      label: "לוח בקרה",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "תמחור",
      href: "/pricing",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "הגדרות",
      href: "/dashboard/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row dark:bg-neutral-900",
        "h-[calc(100vh-68px)]",
      )}
    >
      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <>
              <Logo />
            </>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <button onClick={handleSignOut} className="w-full">
              <div className="flex items-center justify-start gap-2 group/sidebar py-2">
                <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
                <motion.span
                  animate={{
                    display: open ? "inline-block" : "none",
                    opacity: open ? 1 : 0,
                  }}
                  className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                >
                  התנתק
                </motion.span>
              </div>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center gap-2 py-1 text-sm font-normal"
      dir="rtl"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-xl whitespace-pre text-black dark:text-white"
        style={{
          fontFamily: '"Noto Sans Hebrew", "Noto Sans Hebrew Fallback", Arial, Helvetica, sans-serif',
        }}
      >
        GenFans
      </motion.span>
      <Image
        src="/assets/images/logo.png"
        alt="GenFans Logo"
        width={32}
        height={32}
        className="shrink-0"
      />
    </a>
  );
};
