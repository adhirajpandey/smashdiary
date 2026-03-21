import type { Metadata } from "next";
import { Lexend, Space_Grotesk } from "next/font/google";

import { SelectedPlayerProvider } from "@/app/_components/selected-player-provider";
import "./globals.css";
import { listPlayers } from "@/lib/store";

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const players = await listPlayers();

  return (
    <html lang="en" className={`${lexend.variable} ${spaceGrotesk.variable}`}>
      <body>
        <SelectedPlayerProvider players={players}>{children}</SelectedPlayerProvider>
      </body>
    </html>
  );
}
