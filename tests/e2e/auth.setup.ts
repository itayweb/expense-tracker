import { test as setup } from "@playwright/test";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";

const authFile = "tests/e2e/.auth/user.json";

/**
 * Uses @clerk/testing to bypass the sign-in UI entirely.
 * This works regardless of which auth method (Google, email, etc.) the app uses.
 *
 * Requires:
 *   CLERK_SECRET_KEY — to sign the testing token
 *   E2E_CLERK_USER_ID — the Clerk user ID of your test user (user_xxx...)
 *     Find it in: Clerk Dashboard → Users → click the test user → copy User ID
 */
setup("authenticate", async ({ page }) => {
  await clerkSetup();

  await setupClerkTestingToken({
    page,
    userId: process.env.E2E_CLERK_USER_ID!,
  });

  await page.goto("/");

  // Wait until we land on the dashboard (not sign-in, not wizard)
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 30_000,
  });

  await page.context().storageState({ path: authFile });
});
