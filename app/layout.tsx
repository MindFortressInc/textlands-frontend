import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";

export const metadata: Metadata = {
  title: "Textlands",
  description: "AI Text MMO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
