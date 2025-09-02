import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nonprofit Prompt Library",
    template: "%s | Nonprofit Prompt Library"
  },
  description: "AI-powered prompt templates designed specifically for nonprofit organizations. Search, browse, and execute customized prompts to enhance your nonprofit's communication and outreach.",
  keywords: ["nonprofit", "AI", "prompts", "templates", "GPT", "communication", "fundraising", "volunteers"],
  authors: [{ name: "Nonprofit Prompt Library" }],
  creator: "Nonprofit Prompt Library",
  publisher: "Nonprofit Prompt Library",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Nonprofit Prompt Library",
    description: "AI-powered prompt templates designed specifically for nonprofit organizations",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nonprofit Prompt Library",
    description: "AI-powered prompt templates designed specifically for nonprofit organizations",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
