"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStatus } from "@/hooks/use-auth-status";
import { clearSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import Image from "next/image";

export default function Header() {
  const router = useRouter();
  const { isLoggedIn, userEmail } = useAuthStatus();
  const [navClose, setNavClose] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearSession();
    router.replace("/login");
  };

  const toggleNav = () => {
    setNavClose(!navClose);
  };

  return (
    <header className='border-b bg-card p-2'>
      <div className='flex items-center '>
        <div className='mr-auto'>
          <Link href='/' className='text-xl font-bold text-primary'>
            <Image
              src='/halal.png'
              alt='Haram Checker Logo'
              width={100}
              height={100}
            />
          </Link>
        </div>
        <div className='ml-1'>
          {navClose ? (
            <button onClick={toggleNav}>
              {" "}
              <Image
                src='/navigation-bar.png'
                alt='Navigation Bar'
                width={50}
                height={50}
              />
            </button>
          ) : (
            <button onClick={toggleNav}>
              <Image
                src='/close.png'
                alt='Close Navigation Bar'
                width={50}
                height={50}
              />
            </button>
          )}
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <Link href='/' className='text-sm font-medium hover:underline'>
          Home
        </Link>
        <Link href='/settings' className='text-sm font-medium hover:underline'>
          Settings
        </Link>
        {isLoggedIn ? (
          <>
            {userEmail && (
              <span className='text-xs text-muted-foreground'>{userEmail}</span>
            )}
            <button
              type='button'
              onClick={handleLogout}
              className='text-sm font-medium text-destructive hover:underline'
            >
              Logout
            </button>
          </>
        ) : (
          <Link href='/login' className='text-sm font-medium hover:underline'>
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
