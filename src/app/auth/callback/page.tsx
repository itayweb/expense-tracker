"use client";

import { useEffect } from "react";

// Constants from @neondatabase/auth (dist/constants-2bpp2_-f.mjs)
const POPUP_PARAM_NAME = "neon_popup";
const POPUP_CALLBACK_PARAM_NAME = "neon_popup_callback";
const SESSION_VERIFIER_PARAM_NAME = "neon_auth_session_verifier";
const POPUP_MESSAGE_TYPE = "neon-auth:oauth-complete";

export default function CallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPopup = params.get(POPUP_PARAM_NAME) === "1";
    const verifier = params.get(SESSION_VERIFIER_PARAM_NAME);
    const originalCallback = params.get(POPUP_CALLBACK_PARAM_NAME) ?? "/";

    if (!isPopup || !verifier) {
      window.location.replace("/");
      return;
    }

    // Desktop popup flow: opener exists → post verifier + close popup.
    // NeonAuthUIProvider also does this, but on iOS opener may be null so we do it too.
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(
        { type: POPUP_MESSAGE_TYPE, verifier, originalCallback },
        window.location.origin
      );
      window.close();
    }

    // Fallback for iOS Safari: window.open() creates a new tab with opener=null,
    // so the popup mechanism never fires. After a short delay (to let window.close()
    // take effect on desktop), navigate this tab directly to the destination.
    // neonAuthMiddleware will exchange the verifier for a session cookie.
    const timer = setTimeout(() => {
      const navUrl = new URL(originalCallback, window.location.origin);
      navUrl.searchParams.set(SESSION_VERIFIER_PARAM_NAME, verifier);
      window.location.href = navUrl.toString();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
      <p className="text-sm text-gray-500">Completing sign-in…</p>
    </div>
  );
}
