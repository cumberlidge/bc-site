import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barry Cumberlidge",
  description: "A continuous, dated stream of writing and thinking",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={newsreader.className}>
      <body>{children}</body>
    </html>
  );
}
