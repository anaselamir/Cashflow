"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-rule bg-paper-raised p-8 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
          Treasury
        </p>
        <h1 className="font-display mt-1 text-2xl text-ink">
          Cash Flow Dashboard
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-mono uppercase tracking-wide text-ink-soft"
            >
              Username
            </label>
            <input
              id="email"
              type="text"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-rule bg-white px-3 py-2 text-ink outline-none focus:border-brass"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-mono uppercase tracking-wide text-ink-soft"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-rule bg-white px-3 py-2 text-ink outline-none focus:border-brass"
            />
          </div>

          {error ? <p className="text-sm text-rust">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-ink py-2 font-mono text-sm uppercase tracking-wide text-paper transition hover:bg-brass-deep disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
