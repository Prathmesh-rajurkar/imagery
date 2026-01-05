// app/api/auth/register/route.ts
import { supabase } from "@/utils/supabase";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, username } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    // 🔍 Check email
    const { data: emailExists } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (emailExists) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    // 🔍 Check username
    const { data: usernameExists } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (usernameExists) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    // 🔐 Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // ✅ Insert user
    const { error } = await supabase.from("users").insert({
      email,
      username,
      password_hash,
    });

    if (error) throw error;

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
