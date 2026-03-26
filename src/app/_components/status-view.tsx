import type { ReactNode } from "react";

import { SectionHeading } from "@/app/_components/section-heading";

type StatusViewProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function StatusView({ eyebrow, title, description, action }: Readonly<StatusViewProps>) {
  return (
    <section className="status-view">
      <div className="status-view__panel glass">
        <SectionHeading
          align="compact"
          eyebrow={eyebrow}
          title={title}
          titleClassName="status-view__title"
          description={description}
        />
        {action ? <div className="status-view__action">{action}</div> : null}
      </div>
    </section>
  );
}
