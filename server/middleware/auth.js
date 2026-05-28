import { supabase } from "./supabase";
import bcrypt from "bcryptjs";

export async function loginUser(username, password) {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username.trim())
    .single();

  if (error || !user) {
    return {
      success: false,
      message: "User not found"
    };
  }

  const isValid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isValid) {
    return {
      success: false,
      message: "Invalid login"
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    }
  };
}
