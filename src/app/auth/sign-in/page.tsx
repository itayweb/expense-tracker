import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500">Sign in to your expense tracker</p>
        </div>
        <GoogleSignInButton />
      </div>
    </main>
  );
}
