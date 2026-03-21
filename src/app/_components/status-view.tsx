import type { ReactNode } from "react";

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
        <p className="eyebrow" style={{ margin: 0 }}>
          {eyebrow}
        </p>
        <h1 className="display status-view__title">{title}</h1>
        {description ? <p className="status-view__description">{description}</p> : null}
        {action ? <div className="status-view__action">{action}</div> : null}
      </div>
    </section>
  );
}
