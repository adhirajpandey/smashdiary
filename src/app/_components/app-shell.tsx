import { BottomNav } from "@/app/_components/bottom-nav";
import { IdentityPicker } from "@/app/_components/identity-picker";
import { MobileHeader } from "@/app/_components/mobile-header";

export function AppShell({
  children,
  activePath,
}: Readonly<{
  children: React.ReactNode;
  activePath: string;
}>) {
  return (
    <main className="shell">
      <div className="mobile-frame">
        <MobileHeader />
        <div className="app-content" role="presentation">
          <div className="page-stack">{children}</div>
        </div>
        <div className="shell-nav">
          <BottomNav activePath={activePath} />
        </div>
        <IdentityPicker />
      </div>
    </main>
  );
}
