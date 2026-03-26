import Link from "next/link";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/matches", label: "Matches", icon: "clock" },
  { href: "/stats", label: "Stats", icon: "bars" },
];

function Icon({ type }: Readonly<{ type: string }>) {
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

  if (type === "clock") {
    return <span className="nav-icon nav-icon--clock" aria-hidden="true" />;
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
