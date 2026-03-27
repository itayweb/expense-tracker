"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { normalizeUsername, usernameToEmail, validateUsernameFormat } from "@/lib/usernameAuth";

export default function UsernameSignUpForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const check = await fetch(`/api/auth/username-available?username=${encodeURIComponent(u)}`);
      const checkJson = await check.json();
      if (!check.ok) {
        setError(checkJson.reason || "Invalid username.");
        return;
      }
      if (!checkJson.available) {
        setError("Username is already taken.");
        return;
      }

      const email = usernameToEmail(u);
      const res = await authClient.signUp.email({
        email,
        password,
        name: u,
      });

      if (res.error) {
        setError(res.error.message || "Sign up failed.");
        return;
      }

      const profileRes = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      });
      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => ({}));
        setError(
          typeof body.error === "string"
            ? body.error
            : "Account created but profile setup failed. Try signing in."
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign up failed.");
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
      <p className="text-xs text-slate-500">
        Letters, numbers, underscores only. 3–32 characters.
      </p>
      <Input
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <Input
        id="confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-emerald-400 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
