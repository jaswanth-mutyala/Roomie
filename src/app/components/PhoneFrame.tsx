import { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 390, height: 844 }}>
      {/* Device shell */}
      <div
        className="absolute inset-0 rounded-[56px] bg-black"
        style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.45), 0 0 0 2px #111" }}
      />
      <div className="absolute inset-[8px] rounded-[50px] bg-[#FFFBF2] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 h-[28px] w-[110px] rounded-full bg-black" />
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 h-[44px] px-8 flex items-center justify-between z-40 text-[13px]" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
          <span className="text-black">9:41</span>
          <span className="text-black tracking-tight">•••</span>
        </div>
        <div className="absolute inset-0 pt-[44px]">{children}</div>
      </div>
    </div>
  );
}
