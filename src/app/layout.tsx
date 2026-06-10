import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";

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
  title: "OA Engine Workspace",
  description: "Dark-themed OA Engine problem editor workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <div className="flex flex-col min-h-screen bg-[#1a1a1a]">
            <div className="flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
