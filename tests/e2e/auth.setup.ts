import { test as setup, expect } from "@playwright/test";

const authFile = "tests/e2e/.auth/user.json";

/**
 * Signs in using Clerk test mode:
 * - Email: any address with +clerk_test subaddress
 * - Verification code: 424242 (fixed, no real email sent)
 */
setup("authenticate", async ({ page }) => {
  await page.goto("/auth/sign-in");

  // Fill test email
  await page.fill('input[name="identifier"], input[type="email"]', process.env.E2E_CLERK_USER_EMAIL!);
  await page.click('button[type="submit"]:has-text("Continue"), button:has-text("Continue")');

  // Enter the fixed Clerk test verification code
  const codeInput = page.locator('input[name="code"], input[aria-label*="digit"], input[aria-label*="code"]').first();
  await expect(codeInput).toBeVisible({ timeout: 10_000 });
  await codeInput.fill("424242");

  // Wait for redirect to dashboard
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
