import { createClient }
from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL =
  "https://zjydvbjjegrqlgipcnfp.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeWR2YmpqZWdycWxnaXBjbmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjE4NDAsImV4cCI6MjA5NjU5Nzg0MH0.H7vyre3QSdUMDth0CfmQhkJDT-PDL3X_NhUKRlBX5jM";

export const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  export async function signInWithGoogle(){

  return supabase.auth.signInWithOAuth({
    provider: "google"
  });

}

export async function getCurrentUser(){

  const {
    data
  } = await supabase.auth.getUser();

  return data.user;

}