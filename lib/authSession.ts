import Cookies from "js-cookie";

export const WALLET_SESSION_COOKIE = "cp_wallet_session";

export const COOKIE_OPTS = {
  expires: 7,
  path: "/",
  sameSite: "lax" as const,
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
};

export function syncWalletSessionCookie(address: string | null | undefined) {
  if (address) {
    Cookies.set(WALLET_SESSION_COOKIE, address, COOKIE_OPTS);
  } else {
    Cookies.remove(WALLET_SESSION_COOKIE, { path: "/" });
  }
}

export function getWalletSessionCookie(): string | undefined {
  return Cookies.get(WALLET_SESSION_COOKIE);
}
