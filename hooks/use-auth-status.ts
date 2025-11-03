"use client";

import { useSyncExternalStore } from "react";

type AuthSnapshot = {
  isLoggedIn: boolean;
  userEmail: string | null;
};

const EMPTY_SNAPSHOT: AuthSnapshot = {
  isLoggedIn: false,
  userEmail: null,
};

let currentSnapshot: AuthSnapshot = EMPTY_SNAPSHOT;

const readClientSnapshot = (): AuthSnapshot => {
  if (typeof window === "undefined") {
    return currentSnapshot;
  }

  const isLoggedIn = window.localStorage.getItem("isLoggedIn") === "true";
  const userEmail = isLoggedIn ? window.localStorage.getItem("userEmail") : null;

  if (
    currentSnapshot.isLoggedIn === isLoggedIn &&
    currentSnapshot.userEmail === userEmail
  ) {
    return currentSnapshot;
  }

  currentSnapshot = { isLoggedIn, userEmail };
  return currentSnapshot;
};

const getServerSnapshot = () => currentSnapshot;

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => {
    currentSnapshot = readClientSnapshot();
    callback();
  };

  window.addEventListener("storage", handler);
  window.addEventListener("authchange", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("authchange", handler);
  };
};

export function useAuthStatus() {
  return useSyncExternalStore(subscribe, readClientSnapshot, getServerSnapshot);
}
