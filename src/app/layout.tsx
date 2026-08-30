import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { IntakeProvider } from "@/context/IntakeContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "GenoRoot · Hair & Scalp Intake",
  description:
    "Self-filling intake engine for hair and scalp clinical consultations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-950 min-h-screen`}
      >
        <IntakeProvider>{children}</IntakeProvider>
      </body>
    </html>
  );
}
