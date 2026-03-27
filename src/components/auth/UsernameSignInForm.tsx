"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { normalizeUsername, usernameToEmail, validateUsernameFormat } from "@/lib/usernameAuth";

export default function UsernameSignInForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const u = normalizeUsername(username);
    const err = validateUsernameFormat(u);
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      const email = usernameToEmail(u);
      const res = await authClient.signIn.email({
        email,
        password,
      });
      if (res.error) {
        setError(res.error.message || "Sign in failed.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        id="username"
        label="Username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="your_name"
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-slate-400">
        No account?{" "}
        <Link href="/auth/sign-up" className="text-emerald-400 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
