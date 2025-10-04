"use client";

export function SpotlightButton({ text = "Hover me" }) {
  return (
    <div style={{ transform: "none" }}>
      <button className="group relative inline-block cursor-pointer rounded-xl p-px font-semibold leading-6 text-white no-underline shadow-lg transition-all duration-300 hover:shadow-xl"
        style={{
          background: "linear-gradient(135deg, rgba(139, 127, 199, 0.3), rgba(186, 164, 255, 0.3))",
        }}
      >
        <span className="absolute inset-0 overflow-hidden rounded-xl">
          <span 
            className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: "radial-gradient(75% 100% at 50% 0%, rgba(186, 164, 255, 0.6) 0%, rgba(139, 127, 199, 0) 75%)"
            }}
          >
            {" "}
          </span>{" "}
        </span>
        <div 
          className="relative z-10 flex items-center space-x-2 rounded-xl px-6 py-3 ring-1 transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))",
            borderColor: "rgba(139, 127, 199, 0.2)",
            color: "#2B1C57"
          }}
        >
          <span className="font-medium">{text}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            data-slot="icon"
            className="h-6 w-6"
            style={{ color: "#8B7FC7" }}
          >
            <path
              fillRule="evenodd"
              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <span 
          className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r transition-opacity duration-500 group-hover:opacity-60"
          style={{
            backgroundImage: "linear-gradient(to right, transparent, rgba(139, 127, 199, 0.5), transparent)"
          }}
        ></span>
      </button>
    </div>
  );
}