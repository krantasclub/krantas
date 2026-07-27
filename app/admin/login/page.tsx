"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Wrong email or password.");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center px-6 font-mono">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-10">
          <div className="font-display text-5xl text-[#ece7dd] leading-none mb-1.5">KRANTAS</div>
          <div className="text-[10px] tracking-[0.38em] uppercase text-[#9aa19d]">Control Panel</div>
        </div>
        <div className="bg-[#12181a] border border-[rgba(236,231,221,0.14)] px-9 py-10">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="block text-[10px] tracking-[0.32em] uppercase text-[#9aa19d] mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-2 text-base outline-none w-full focus:border-[#ff8a1e] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.32em] uppercase text-[#9aa19d] mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="bg-transparent border-0 border-b border-[rgba(236,231,221,0.3)] text-[#ece7dd] py-2 text-base outline-none w-full focus:border-[#ff8a1e] transition-colors"
              />
            </div>
            {error && <p className="text-xs text-[#e5837f]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="border border-[#ff8a1e] text-[#ff8a1e] hover:bg-[#ff8a1e] hover:text-[#12100c] transition-colors text-xs tracking-[0.18em] uppercase px-5 py-3 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
        <div className="text-center mt-5">
          <Link href="/" className="text-[11px] tracking-[0.22em] uppercase text-[#9aa19d] hover:text-[#ff8a1e] transition-colors">
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
