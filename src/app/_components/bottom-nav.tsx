import Link from "next/link";

import { appRoutes } from "@/lib/config/routes";
import { cn } from "@/lib/utils";

type NavIconType = "grid" | "scorecard" | "bars";

const navItems = [
  { href: appRoutes.dashboard, label: "Dashboard", icon: "grid" },
  { href: appRoutes.matches, label: "Matches", icon: "scorecard" },
  { href: appRoutes.stats, label: "Stats", icon: "bars" },
] as const;

function Icon({ type }: Readonly<{ type: NavIconType }>) {
  if (type === "grid") {
    return (
      <span className="nav-icon nav-icon--grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
    );
  }

  if (type === "scorecard") {
    return (
      <span className="nav-icon nav-icon--scorecard" aria-hidden="true">
        <span />
        <span />
      </span>
    );
  }

  return (
    <span className="nav-icon nav-icon--bars" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function BottomNav({ activePath }: Readonly<{ activePath: string }>) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navItems.map((item) => (
        <Link className={cn("bottom-nav__item", activePath === item.href && "is-active")} href={item.href} key={item.href}>
          <Icon type={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
