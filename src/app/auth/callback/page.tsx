// This page exists so Next.js serves the /auth/callback route.
// The NeonAuthUIProvider in layout.tsx automatically detects the
// ?neon_popup=1 parameter and handles posting the session verifier
// back to the parent window, then closes the popup.
export default function CallbackPage() {
  return null;
}
