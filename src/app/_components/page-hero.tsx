import type { ReactNode } from "react";

import { SectionHeading } from "@/app/_components/section-heading";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  feature?: ReactNode;
  empty?: boolean;
  titleClassName?: string;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  meta,
  feature,
  empty = false,
  titleClassName,
  className,
}: Readonly<PageHeroProps>) {
  return (
    <section
      className={cn(
        "page-hero",
        "glass",
        empty && "page-hero--empty",
        meta && "page-hero--with-meta",
        feature && "page-hero--with-feature",
        className,
      )}
    >
      <div className="page-hero__body">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          titleClassName={cn("page-title page-hero__title", titleClassName)}
        />
        {meta ? <div className="page-hero__meta">{meta}</div> : null}
      </div>
      {feature ? <div className="page-hero__feature">{feature}</div> : null}
    </section>
  );
}
