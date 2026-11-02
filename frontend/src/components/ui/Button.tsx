import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const STYLES: Record<Variant, string> = {
  primary:
    "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold border border-cyan-400",
  secondary:
    "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600",
  danger:
    "bg-red-600 hover:bg-red-500 text-white border border-red-500",
  ghost:
    "bg-transparent hover:bg-slate-800 text-slate-300 border border-transparent",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "secondary",
  className = "",
  ...rest
}: Props) {
  return (
    <button
      className={`px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${STYLES[variant]} ${className}`}
      {...rest}
    />
  );
}