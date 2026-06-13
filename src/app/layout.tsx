import type { Metadata } from "next";
import localFont from "next/font/local";
import { Josefin_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "OA Engine",
  description: "OA Engine problem workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${josefinSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <div className="flex flex-col min-h-screen bg-black">
            <div className="flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}

