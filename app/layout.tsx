import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cherry Pick - Blockchain Contract Farming Platform",
  description: "Digitize, secure, and optimize contract farming for high-value fruits and vegetables with blockchain technology",
  icons: {
    icon: '/cherrypick-logo.png',
    apple: '/cherrypick-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
