import {
  supabase
}
from "./supabase.js";

export async function register(email, password){
  const result = await supabase.auth.signUp({email,password});
  console.log("REGISTER RESULT", result);
  console.log("ERROR MESSAGE", result.error?.message);
  console.log("ERROR CODE", result.error?.code);
  console.log("REGISTER USER", result.data.user);
  console.log("REGISTER SESSION", result.data.session);
  return result;
}

export async function login(
  email,
  password
){

  return await supabase.auth.signInWithPassword({

    email,

    password

  });

}

export async function logout(){

  return await supabase.auth.signOut();

}