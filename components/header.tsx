"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStatus } from "@/hooks/use-auth-status";
import { clearSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import Image from "next/image";
import { useTranslate } from "@/hooks/use-translate";

export default function Header() {
  const router = useRouter();
  const { isLoggedIn, userEmail } = useAuthStatus();
  const [navClose, setNavClose] = useState(true);
  const { t, toggleLanguage } = useTranslate();

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
              width={70}
              height={70}
            />
          </Link>
        </div>
        <div className='mr-2 z-50'>
          {navClose ? (
            <button onClick={toggleNav}>
              {" "}
              <Image
                src='/navigation-bar.png'
                alt='Navigation Bar'
                width={40}
                height={40}
              />
            </button>
          ) : (
            <button onClick={toggleNav}>
              <Image
                src='/close.png'
                alt='Close Navigation Bar'
                width={40}
                height={40}
              />
            </button>
          )}
        </div>
      </div>
      <div className='flex justify-end mt-2'>
        <button
          type='button'
          onClick={toggleLanguage}
          className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
          aria-label={t("header.languageToggleAria")}
        >
          {t("header.languageToggle")}
        </button>
      </div>
      {!navClose && (
        <div
          className='fixed inset-0 bg-black bg-opacity-60 z-10 transition-opacity duration-300 ease-in-out'
          onClick={toggleNav}
        />
      )}
      {/* サイドバー */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-20 transform transition-transform duration-300 ease-in-out ${
          !navClose ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className='p-4'>
          {/* ユーザー情報 */}
          {isLoggedIn && userEmail && (
            <div className='mt-20 mb-6 pb-6 border-b'>
              <p className='text-sm text-gray-500'>{t("header.signedInAs")}</p>
              <p className='text-sm font-medium truncate'>{userEmail}</p>
            </div>
          )}

          {/* ナビゲーションリンク */}
          <nav className='space-y-2'>
            <Link
              href='/'
              onClick={toggleNav}
              className='flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                />
              </svg>
              {t("header.home")}
            </Link>

            <Link
              href='/settings'
              onClick={toggleNav}
              className='flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                />
              </svg>
              {t("header.settings")}
            </Link>

            {/* 追加のリンクをここに追加できます */}
            <Link
              href='/about'
              onClick={toggleNav}
              className='flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              {t("header.about")}
            </Link>

            <Link
              href='/contact'
              onClick={toggleNav}
              className='flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                />
              </svg>
              {t("header.contact")}
            </Link>
          </nav>

          {/* ログイン/ログアウトボタン */}
          <div className='absolute bottom-8 left-4 right-4'>
            {isLoggedIn ? (
              <button
                type='button'
                onClick={() => {
                  handleLogout();
                  toggleNav();
                }}
                className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
                {t("header.logout")}
              </button>
            ) : (
              <Link
                href='/login'
                onClick={toggleNav}
                className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
                {t("header.login")}
              </Link>
            )}
          </div>
        </div>
      </aside>
    </header>
  );
}
