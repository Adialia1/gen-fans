// Landing page style utilities - all CSS inline as requested

// Helper function to combine module styles with Tailwind classes
export const cx = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Button Styles
export const buttonStyles = {
  primary: "px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center tracking-tight bg-black text-white",
  text: "px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center tracking-tight text-black bg-transparent",
};

// Section Styles
export const sectionStyles = {
  title: "text-center text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter",
  description: "text-center text-[22px] leading-[30px] tracking-tight text-[#010D3E]",
  heading: "max-w-[540px] mx-auto",
};

// Landing Styles object for compatibility
export const landingStyles = {
  // Button classes
  btn: "px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center tracking-tight",
  btnPrimary: "bg-black text-white",
  btnText: "text-black bg-transparent",
  
  // Logo Ticker
  logoTickerImage: "h-8 w-auto",
  
  // Tag Component
  tag: "text-sm inline-flex border border-[#A78BFA]/30 bg-[#F3F0FF] px-3 py-1 rounded-lg tracking-tight text-[#6B46C1]",
  
  // Section classes
  sectionTitle: "text-center text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter",
  sectionDes: "text-center text-[22px] leading-[30px] tracking-tight text-[#010D3E]",
  sectionHeading: "max-w-[540px] mx-auto",
  
  // Card Component
  card: "p-10 rounded-3xl border border-[#F1F1F1] shadow-[0_7px_14px_#EAEAEA] max-w-xs w-full",
  
  // Testimonials styles
  testimonialCard: "p-8 rounded-3xl bg-white border border-gray-200 shadow-lg",
  testimonialText: "text-lg leading-relaxed text-gray-700 mb-6",
  testimonialAuthor: "text-base font-semibold text-gray-900",
  testimonialRole: "text-sm text-gray-500",
  testimonialAvatar: "w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500",
  
  // CTA styles
  ctaContainer: "py-24 bg-gradient-to-b from-white to-[#D2DCFF] overflow-x-clip",
  ctaContent: "max-w-[540px] mx-auto relative",
  ctaTitle: "text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter text-center",
  ctaDescription: "text-[22px] leading-[30px] tracking-tight text-[#010D3E] text-center mt-5",
  ctaButton: "mt-8 flex justify-center",
  
  // Hero styles
  heroTitle: "text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-black to-[#001E80] text-transparent bg-clip-text mt-6",
  heroDescription: "text-xl text-[#010D3E] tracking-tight mt-6",
  
  // FAQ styles
  faqContainer: "py-24 bg-white",
  faqTitle: "text-3xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter text-center",
  faqItem: "border-b border-gray-200 py-6",
  faqQuestion: "text-lg font-semibold text-gray-900",
  faqAnswer: "text-gray-600 mt-4",
  
  // Footer styles
  footerContainer: "bg-black text-white py-12",
  footerLink: "text-white/70 hover:text-white transition-colors",
  footerText: "text-white/50 text-sm",
};