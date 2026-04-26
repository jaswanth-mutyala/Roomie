import { ReactNode } from "react";

export function BentoCard({
  children,
  className = "",
  style,
  shadow = true,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  shadow?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[28px] border-2 border-black ${className}`}
      style={{
        boxShadow: shadow ? "5px 5px 0 0 rgba(0,0,0,1)" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
