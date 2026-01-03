import { supabase } from "@/utils/supabase";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, username } = await req.json();

    if (!email || !password || !username) {
      return new Response("Missing fields", { status: 400 });
    }

    const user = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("username", username)
      .single()
      .then((res) => res.data);

    if (user) {
      return new Response("User already exists", { status: 400 });
    }

    const { data, error } = await supabase.from("users").insert([
      {
        email,
        password,
        username,
      },
    ]);

    if (error) {
      throw error;
    }

    return new Response("User registered", { status: 201 });
  } catch (error) {

    console.error("Registration error:", error);
    return new Response("Internal Server Error", { status: 500 });
    
  }
}
