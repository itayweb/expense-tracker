import { test as setup } from "@playwright/test";

const authFile = "tests/e2e/.auth/user.json";

/**
 * Signs in by creating a Clerk sign-in token via the Backend API, then navigating
 * to the sign-in page with that token. This bypasses the sign-in UI entirely —
 * no password screen, no new-device OTP, no OAuth popups.
 *
 * Requires in .env.test / CI secrets:
 *   CLERK_SECRET_KEY     — Clerk secret key to call the Backend API
 *   E2E_CLERK_USER_ID   — ID of the test user (user_xxx from Clerk Dashboard)
 */
setup("authenticate", async ({ page }) => {
  const res = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: process.env.E2E_CLERK_USER_ID,
      expires_in_seconds: 60,
    }),
  });

  const { token } = await res.json();

  await page.goto(`/auth/sign-in?__clerk_ticket=${token}`);

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 30_000,
  });

  await page.context().storageState({ path: authFile });
});
