"use client";

import { useState } from "react";
import { login, signup } from "./actions";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    let result;
    try {
      if (isLogin) {
        result = await login(formData);
      } else {
        result = await signup(formData);
      }

      if (result && 'error' in result && result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result && 'success' in result && result.success) {
        setSuccess(result.success as string);
        setLoading(false);
        // Clear password
        (e.target as HTMLFormElement).reset();
      } else {
        // Redirect happened
      }
    } catch (err) {
      // If NEXT_REDIRECT is thrown by redirect(), it gets caught here.
      // But actually, Server Actions return an error instead of throwing to the client in some Next.js versions.
      // Just in case:
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="mac-card p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🩰</span>
          </div>
          <h1 className="text-2xl font-bold text-main">Nutcracker AI</h1>
          <p className="text-sm text-muted mt-2">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email address"
              className="mac-input"
              required
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="mac-input"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}
          {success && <p className="text-green-500 text-xs font-semibold text-center">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mac-button-primary w-full py-2.5"
          >
            {loading ? "Authenticating..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            className="text-xs text-muted hover:text-main transition-colors font-semibold"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
