import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title?: string;
  description?: string;
  align?: "default" | "compact";
  titleClassName?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "default",
  titleClassName,
}: Readonly<SectionHeadingProps>) {
  return (
    <div className={cn("section-heading", align === "compact" && "section-heading--compact")}>
      <p className="eyebrow section-heading__eyebrow">{eyebrow}</p>
      {title ? <h2 className={cn("display section-heading__title", titleClassName)}>{title}</h2> : null}
      {description ? <p className="section-heading__description">{description}</p> : null}
    </div>
  );
}
