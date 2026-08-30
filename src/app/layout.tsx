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
  title: "GenoRoot Hair & Scalp Clinic · The Intake That Fills Itself",
  description:
    "An ambient, voice-copilot intake that eliminates manual forms for patients and delivers instant structured data to trichologists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100 text-slate-900 min-h-screen`}
      >
        <IntakeProvider>{children}</IntakeProvider>
      </body>
    </html>
  );
}
