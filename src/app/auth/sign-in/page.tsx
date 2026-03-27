import { AuthView } from "@neondatabase/auth/react";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A2E] rounded-2xl shadow-lg shadow-black/20 border border-white/[0.08] p-6">
        <AuthView path="sign-in" />
      </div>
    </main>
  );
}

