import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Haram Checker",
  description: "Check if a product is Halal and matches your allergens.",
};

function Header() {
  return (
    <header className="p-4 bg-card border-b">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary">
          Haram Checker
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
          <Link href="/settings" className="text-sm font-medium hover:underline">
            Settings
          </Link>
          <Link href="/login" className="text-sm font-medium hover:underline">
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
