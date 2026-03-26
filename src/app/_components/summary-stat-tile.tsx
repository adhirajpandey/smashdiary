import { cn } from "@/lib/utils";

export function SummaryStatTile({
  label,
  value,
  accent = "default",
}: Readonly<{
  label: string;
  value: string | number;
  accent?: "default" | "primary" | "secondary";
}>) {
  return (
    <div className="summary-stat">
      <p className="section-title summary-stat__label">{label}</p>
      <p className={cn("display summary-stat__value", accent !== "default" && `summary-stat__value--${accent}`)}>{value}</p>
    </div>
  );
}
