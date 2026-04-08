"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";
import Image from "next/image";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/pos");
    }
  }, [status, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        const callbackUrl = searchParams.get("callbackUrl") || "/pos";
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent flicker before redirect
  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-surface overflow-hidden antialiased">
      {/* Left Side: Immersive Visual */}
      <section className="hidden md:block relative overflow-hidden bg-surface-container-low">
        <Image
          src="/images/auth/showroom.jpg"
          alt="Luxury Showroom"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        {/* Glass Overlay for Tonal Depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-tertiary/10 backdrop-blur-[2px]"></div>

        {/* Branding Accent */}
        <div className="absolute bottom-12 left-12 max-w-md">
          <h2 className="text-white text-4xl font-black tracking-tighter mb-4 leading-tight">
            The Secure Curator
          </h2>
          <div className="w-16 h-1 bg-primary-fixed-dim rounded-full mb-6"></div>
          <p className="text-white/80 text-lg font-medium">
            Defining the standard of excellence in rental asset management.
          </p>
        </div>
      </section>

      {/* Right Side: Focused Interaction Zone */}
      <section className="flex flex-col items-center justify-center p-8 md:p-16 bg-surface-container-low">
        <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl p-10 shadow-[0px_24px_48px_rgba(21,28,39,0.06)] backdrop-blur-xl border border-white/20">
          {/* Header Section */}
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 mb-8">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                vm_group
              </span>
              <span className="text-2xl font-black tracking-tighter text-primary">
                Costume POS
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-on-surface-variant text-sm font-medium">
              Please enter your credentials to access the rental board.
            </p>
          </div>

          {/* Form Section */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Input Username / Staff ID */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1"
              >
                Email or Staff ID
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="e.g. admin"
                  className="w-full bg-surface-container-high border-none rounded-lg py-4 px-5 text-on-surface placeholder-outline font-medium focus:ring-2 focus:ring-primary-fixed-dim focus:bg-surface-container-lowest transition-all duration-300 outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors cursor-default">
                  alternate_email
                </span>
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1"
              >
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full bg-surface-container-high border-none rounded-lg py-4 px-5 text-on-surface placeholder-outline font-medium focus:ring-2 focus:ring-primary-fixed-dim focus:bg-surface-container-lowest transition-all duration-300 outline-none pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center justify-between text-sm py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary-fixed-dim bg-surface-container-high transition-all"
                />
                <span className="text-on-surface-variant font-medium group-hover:text-on-surface transition-colors">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="text-primary font-semibold hover:text-primary-container hover:underline underline-offset-4 transition-all"
              >
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white font-bold rounded-full shadow-lg transition-all duration-200 mt-4 flex justify-center items-center gap-2 relative ${
                loading
                  ? "bg-surface-variant text-on-surface-variant select-none"
                  : "bg-gradient-to-br from-primary to-primary-container shadow-primary/10 hover:shadow-primary/25 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Trust Badge Component */}
          <div className="mt-10 pt-8 border-t border-surface-container-high flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tertiary-container/10 border border-tertiary-container/20">
              <span
                className="material-symbols-outlined text-[16px] text-on-tertiary-fixed-variant"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed-variant">
                256-bit Encrypted Environment
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex items-center justify-center gap-8 text-xs font-medium tracking-wide uppercase text-slate-400">
          <a className="hover:text-primary transition-colors" href="#">
            Privacy Policy
          </a>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <a className="hover:text-primary transition-colors" href="#">
            Contact Support
          </a>
        </footer>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
