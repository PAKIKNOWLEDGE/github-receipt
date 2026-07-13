import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "GitHub Receipts",
  description:
    "Create a receipt-style GitHub summary! Showcase your repos, stars & contributions. Visualize your milestones uniquely. Celebrate your coding journey!",
  keywords: ["github", "github receipt", "github profile", "github widget", "github summary"],
  openGraph: {
    type: "website",
    url: "https://gitreceipt.itsvg.in",
    title: "GitHub Receipts",
    description: "Create a receipt-style GitHub summary! Showcase your repos, stars & contributions.",
    images: ["https://gitreceipt.itsvg.in/webimg.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Receipts",
    description: "Create a receipt-style GitHub summary! Showcase your repos, stars & contributions.",
    images: ["https://gitreceipt.itsvg.in/webimg.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
