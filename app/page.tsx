'use client';

import './landing-page.css';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import components that use router hooks to prevent SSR issues
const Hero = dynamic(() => import("@/components/landing/Hero").then(mod => ({ default: mod.Hero })), { ssr: false });
const ParallaxScrollDemo = dynamic(() => import("@/components/landing/ParallaxScrollDemo").then(mod => ({ default: mod.ParallaxScrollDemo })), { ssr: false });
const IntegrationFlow = dynamic(() => import("@/components/landing/IntegrationFlow").then(mod => ({ default: mod.IntegrationFlow })), { ssr: false });
const Pricing = dynamic(() => import("@/components/landing/Pricing").then(mod => ({ default: mod.Pricing })), { ssr: false });
const Testimonials = dynamic(() => import("@/components/landing/Testimonials").then(mod => ({ default: mod.Testimonials })), { ssr: false });
const FAQ = dynamic(() => import("@/components/landing/FAQ").then(mod => ({ default: mod.FAQ })), { ssr: false });
const CallToAction = dynamic(() => import("@/components/landing/CallToAction").then(mod => ({ default: mod.CallToAction })), { ssr: false });
const Footer = dynamic(() => import("@/components/landing/Footer").then(mod => ({ default: mod.Footer })), { ssr: false });

export default function Home() {
  return (
    <div className="landing-page antialiased">
      <Suspense fallback={<div></div>}>
        <Hero />
        <ParallaxScrollDemo />
        <IntegrationFlow />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CallToAction />
        <Footer />
      </Suspense>
    </div>
  );
}
