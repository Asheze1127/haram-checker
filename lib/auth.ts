"use client";

export type StoredUser = {
  email: string;
  password: string;
};

const USERS_KEY = "hc_users";
const LOGGED_IN_KEY = "isLoggedIn";
const EMAIL_KEY = "userEmail";

const ensureBrowser = () => {
  if (typeof window === "undefined") {
    throw new Error("Authentication storage is only available in the browser.");
  }
};

const readUsers = (): StoredUser[] => {
  ensureBrowser();
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    if (Array.isArray(parsed)) {
      return parsed.filter((user) => typeof user.email === "string");
    }
    return [];
  } catch (error) {
    console.error("Failed to parse stored users", error);
    return [];
  }
};

const persistUsers = (users: StoredUser[]) => {
  ensureBrowser();
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export function registerUser(user: StoredUser) {
  const users = readUsers();
  const alreadyExists = users.some(
    (storedUser) =>
      storedUser.email.trim().toLowerCase() === user.email.trim().toLowerCase()
  );

  if (alreadyExists) {
    return { success: false, error: "An account with that email already exists." as const };
  }

  persistUsers([...users, user]);
  startSession(user);
  return { success: true as const };
}

export function authenticateUser(email: string, password: string) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const matchedUser = users.find(
    (user) =>
      user.email.trim().toLowerCase() === normalizedEmail &&
      user.password === password
  );

  if (!matchedUser) {
    return { success: false, error: "Invalid email or password." as const };
  }

  startSession(matchedUser);
  return { success: true as const, user: matchedUser };
}

export function startSession(user: StoredUser) {
  ensureBrowser();
  window.localStorage.setItem(LOGGED_IN_KEY, "true");
  window.localStorage.setItem(EMAIL_KEY, user.email);
  window.dispatchEvent(new Event("authchange"));
}

export function clearSession() {
  ensureBrowser();
  window.localStorage.removeItem(LOGGED_IN_KEY);
  window.localStorage.removeItem(EMAIL_KEY);
  window.dispatchEvent(new Event("authchange"));
}
