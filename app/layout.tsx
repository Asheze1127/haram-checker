import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import { TranslationProvider } from "@/hooks/use-translate";

export const metadata: Metadata = {
  title: "Haram Checker",
  description: "Check if a product is Halal and matches your allergens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <TranslationProvider>
          <Header />
          <main>{children}</main>
        </TranslationProvider>
      </body>
    </html>
  );
}
