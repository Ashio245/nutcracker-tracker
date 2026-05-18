"use server";

import { createClient } from "@/utils/supabase/server";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const newPassword = formData.get("password") as string;
  
  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password updated successfully!" };
}
