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
  title: "LeetCode Workspace",
  description: "Dark-themed LeetCode problem editor workspace.",
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
            <header className="flex h-10 w-full items-center justify-between border-b border-[#282828] bg-[#1a1a1a] px-4 text-xs select-none">
              <div className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                Session Control
              </div>
              <div className="flex items-center space-x-2">
                <Show when="signed-out">
                  <div className="flex items-center space-x-2">
                    <SignInButton mode="modal">
                      <button className="px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#3e3e3e] text-gray-300 font-semibold transition-all cursor-pointer">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-2.5 py-1 rounded bg-[#ffa116] hover:bg-[#ffa116]/90 active:bg-[#e68e0f] text-black font-bold transition-all shadow-sm cursor-pointer">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-medium">Account:</span>
                    <UserButton />
                  </div>
                </Show>
              </div>
            </header>
            <div className="flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
