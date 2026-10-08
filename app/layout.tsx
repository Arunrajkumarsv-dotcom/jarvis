import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Jarvis HUD", description: "A local-first autonomous action agent" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08080c] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
