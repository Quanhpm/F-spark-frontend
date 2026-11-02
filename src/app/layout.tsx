import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "F-Spark",
  description: "EXE Project Management System",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "F-Spark",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={roboto.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
