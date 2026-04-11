import { test as setup, expect } from "@playwright/test";

const authFile = "tests/e2e/.auth/user.json";

/**
 * Signs in using Clerk test mode:
 * - Email must use +clerk_test subaddress (e.g. you+clerk_test@gmail.com)
 *   This bypasses Google OAuth and uses the email code flow instead.
 * - Verification code is always 424242 (no real email sent)
 *
 * One-time setup: sign in manually with the +clerk_test email once to
 * create the user in Clerk, then set E2E_CLERK_USER_EMAIL in .env.test.
 */
setup("authenticate", async ({ page }) => {
  await page.goto("/auth/sign-in");

  // Fill the +clerk_test email
  await page.fill('input[name="identifier"], input[type="email"]', process.env.E2E_CLERK_USER_EMAIL!);
  await page.click('button[type="submit"]:has-text("Continue"), button:has-text("Continue")');

  // Enter the fixed Clerk test verification code
  const codeInput = page.locator('input[name="code"], input[aria-label*="digit"], input[aria-label*="code"]').first();
  await expect(codeInput).toBeVisible({ timeout: 10_000 });
  await codeInput.fill("424242");

  // Submit if there's a separate submit button (some Clerk UIs auto-submit)
  const submitBtn = page.locator('button[type="submit"]:has-text("Continue"), button:has-text("Verify")');
  if (await submitBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await submitBtn.click();
  }

  // Wait for redirect to dashboard
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
