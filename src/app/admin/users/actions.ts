"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function getUsers() {
  try {
    // First, verify the caller is actually an admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Resolve admin emails from env var to enforce strict security
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
      
    const isUserAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());
    const role = isUserAdmin ? "admin" : (user?.user_metadata?.role || "member");

    if (role !== "admin") {
      throw new Error("Unauthorized");
    }

    const adminAuth = createAdminClient();
    const { data: { users }, error } = await adminAuth.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    return { users };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateUserRole(userId: string, newRole: "admin" | "member") {
  try {
    // First, verify the caller is actually an admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
      
    const isUserAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());
    const role = isUserAdmin ? "admin" : (user?.user_metadata?.role || "member");

    if (role !== "admin") {
      throw new Error("Unauthorized");
    }

    const adminAuth = createAdminClient();
    const { error } = await adminAuth.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole }
    });

    if (error) {
      throw error;
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function inviteUser(email: string, role: "admin" | "member") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
      
    const isUserAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());
    const callerRole = isUserAdmin ? "admin" : (user?.user_metadata?.role || "member");

    if (callerRole !== "admin") {
      throw new Error("Unauthorized");
    }

    const adminAuth = createAdminClient();
    
    // Check if user already exists
    const { data: { users } } = await adminAuth.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      await adminAuth.auth.admin.updateUserById(existingUser.id, { user_metadata: { role } });
      revalidatePath("/admin/users");
      return { success: "User already existed. We just updated their role to " + role + "!" };
    }

    // Bypass Supabase email rate limits by directly creating the user as auto-confirmed
    const tempPassword = Math.random().toString(36).slice(-8) + "!"; // Random 9 char password
    
    const { error } = await adminAuth.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role }
    });

    if (error) {
      throw error;
    }

    revalidatePath("/admin/users");
    return { success: `Success! Account created as ${role}. Temporary Password: ${tempPassword}` };
  } catch (err: any) {
    return { error: err.message };
  }
}
