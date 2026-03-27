/**
 * Username maps to a synthetic email for Neon Auth (email+password API).
 * Domain must be stable per deployment. Use NEXT_PUBLIC_* so the browser
 * builds the same address as the server (sign-in form runs on the client).
 */
export function getUsernameEmailDomain(): string {
  return (
    process.env.NEXT_PUBLIC_USERNAME_EMAIL_DOMAIN ||
    process.env.USERNAME_EMAIL_DOMAIN ||
    "internal.local"
  );
}

/** Lowercase, trim, allow a-z 0-9 underscore, 3-32 chars */
export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function validateUsernameFormat(username: string): string | null {
  if (username.length < 3 || username.length > 32) {
    return "Username must be 3–32 characters.";
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Use only letters, numbers, and underscores.";
  }
  return null;
}

export function usernameToEmail(username: string): string {
  const u = normalizeUsername(username);
  const domain = getUsernameEmailDomain();
  return `${u}@${domain}`;
}
