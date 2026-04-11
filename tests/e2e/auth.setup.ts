import { test as setup } from "@playwright/test";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";

const authFile = "tests/e2e/.auth/user.json";

/**
 * Bypasses the sign-in UI entirely using @clerk/testing.
 * Works regardless of OAuth provider (Google, GitHub, etc.).
 *
 * Requires in .env.test / CI secrets:
 *   CLERK_SECRET_KEY      — used to sign the testing token
 *   E2E_CLERK_USER_ID     — Clerk user ID to authenticate as (user_2abc...)
 *     Find it: Clerk Dashboard → Users → click your user → copy User ID
 */
setup("authenticate", async ({ page }) => {
  await clerkSetup();

  await setupClerkTestingToken({
    page,
    userId: process.env.E2E_CLERK_USER_ID!,
  });

  await page.goto("/");

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 30_000,
  });

  await page.context().storageState({ path: authFile });
});
