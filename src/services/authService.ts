import { supabase } from "@/integrations/supabase/client";

export type Role = "user" | "admin";

export async function authSignUp(
  name: string,
  email: string,
  password: string,
  role: Role,
): Promise<string | null> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  return error?.message ?? null;
}

export async function authSignIn(
  email: string,
  password: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return error.message;
  if (!data.session) {
    return "Sign-in incomplete. Check your email for a confirmation link, then try again.";
  }
  return null;
}

export async function authSignInWithGitHub(): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}` },
  });
  return error?.message ?? null;
}

export async function authSignOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function authResetPassword(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  return error?.message ?? null;
}

export async function authUpdateProfile(name: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not authenticated";

  const { error: authError } = await supabase.auth.updateUser({ data: { name } });
  if (authError) return authError.message;

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", user.id);

  return dbError?.message ?? null;
}

export async function authUpdatePassword(newPassword: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error?.message ?? null;
}
