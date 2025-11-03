"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStatus } from "@/hooks/use-auth-status";
import { clearSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();
  const { isLoggedIn, userEmail } = useAuthStatus();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearSession();
    router.replace("/login");
  };

  return (
    <header className="border-b bg-card p-4">
      <nav className="container mx-auto flex items-center justify-between">
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
          {isLoggedIn ? (
            <>
              {userEmail && (
                <span className="text-xs text-muted-foreground">{userEmail}</span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-destructive hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:underline">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
