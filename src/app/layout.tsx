import type { Metadata } from "next";
import { Lexend, Space_Grotesk } from "next/font/google";

import { AppQueryProvider } from "@/app/_components/query-provider";
import { SelectedPlayerProvider } from "@/app/_components/selected-player-provider";
import { StatsFormatProvider } from "@/app/_components/stats-format-provider";
import { ToastProvider } from "@/app/_components/toast-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smash Diary",
  description: "Track standalone badminton games with kinetic precision.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lexend.variable} ${spaceGrotesk.variable}`}>
      <body>
        <AppQueryProvider>
          <SelectedPlayerProvider>
            <StatsFormatProvider>
              <ToastProvider>{children}</ToastProvider>
            </StatsFormatProvider>
          </SelectedPlayerProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
