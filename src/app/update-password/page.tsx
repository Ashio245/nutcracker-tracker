"use client";

import { useState } from "react";
import { updatePassword } from "./actions";

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(result.success);
      (e.target as HTMLFormElement).reset();
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-xl mx-auto">
      <div className="mac-card p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-main">Update Password</h1>
          <p className="text-sm text-muted mt-1">Please set a new secure password for your account.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">New Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter new password"
              className="mac-input w-full"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
          {success && <p className="text-green-500 text-xs font-semibold">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mac-button-primary w-full py-2.5"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
