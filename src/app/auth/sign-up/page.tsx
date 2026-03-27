import UsernameSignUpForm from "@/components/auth/UsernameSignUpForm";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A2E] rounded-2xl shadow-lg shadow-black/20 border border-white/[0.08] p-6">
        <h1 className="text-xl font-bold text-slate-100 mb-1">Create account</h1>
        <p className="text-sm text-slate-400 mb-6">Pick a username and password.</p>
        <UsernameSignUpForm />
      </div>
    </main>
  );
}
