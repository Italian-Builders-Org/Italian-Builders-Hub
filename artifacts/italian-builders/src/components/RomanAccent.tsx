import type { ReactNode } from "react";

type RomanDividerProps = {
  className?: string;
};

export function RomanDivider({ className = "" }: RomanDividerProps) {
  return (
    <div
      className={`dt-roman-divider ${className}`}
      role="presentation"
      aria-hidden="true"
    />
  );
}

type RomanEyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function RomanEyebrow({ children, className = "" }: RomanEyebrowProps) {
  return (
    <div className={`dt-roman-eyebrow ${className}`}>
      <span className="dt-roman-eyebrow-mark" aria-hidden="true" />
      <span>{children}</span>
      <span className="dt-roman-eyebrow-mark" aria-hidden="true" />
    </div>
  );
}
