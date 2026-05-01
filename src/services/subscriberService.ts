"use server";

import { supabase } from "@/lib/supabase";

export async function subscribeEmail(formData: FormData) {
  const rawEmail = formData.get("email") as string;
  const email = rawEmail?.trim();

  // 1. Validation: Empty Email
  if (!email) {
    return { success: false, message: "Email is required." };
  }

  // 2. Validation: Simple format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  // 3. Insert into Supabase
  const { error } = await supabase
    .from("subscribers")
    .insert([{ email, is_active: true }]);

  if (error) {
    // Check for Postgres unique constraint error code (duplicate email)
    if (error.code === "23505") {
      return { success: false, message: "This email is already subscribed." };
    }
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }

  return { success: true, message: "Success! You are on the list." };
}
