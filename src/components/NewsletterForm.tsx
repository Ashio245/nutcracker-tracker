"use client";

import { useState } from "react";
import { subscribeEmail } from "@/services/subscriberService";

export default function NewsletterForm() {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Stop page from reloading

    // FIX: Capture the form reference immediately before the async wait
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setMessage("");

    const result = await subscribeEmail(formData);

    setMessage(result.message);
    setIsSuccess(result.success);
    setIsSubmitting(false);

    if (result.success) {
      form.reset(); // Use the captured reference instead of event.currentTarget
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          name="email"
          type="email"
          placeholder="email@example.com"
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white w-full outline-none focus:border-gray-900"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            isSubmitting
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {isSubmitting ? "Joining..." : "Join List"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-sm font-medium ${isSuccess ? "text-green-600" : "text-red-500"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
