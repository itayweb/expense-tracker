import { test as setup } from "@playwright/test";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";

const authFile = "tests/e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await clerkSetup();

  await setupClerkTestingToken({ page });

  await page.goto("/");

  // Wait until redirected away from sign-in (i.e. authenticated)
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 30_000,
  });

  await page.context().storageState({ path: authFile });
});
