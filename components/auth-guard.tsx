"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStatus } from "@/hooks/use-auth-status";

type AuthGuardProps = {
  children: ReactNode;
};

/**
 * Guards a route by ensuring the user has a truthy `isLoggedIn` flag in localStorage.
 * Redirects to the login page when unauthenticated.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStatus();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">
          Redirecting to login…
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
