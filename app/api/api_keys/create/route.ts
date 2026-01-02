
import { supabase } from "@/utils/supabase";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, name } = body;

    if (!user_id) {
      return NextResponse.json(
        { message: "user_id is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Generate RAW API key (return this once)
    const rawKey =
      "img_live_" + crypto.randomBytes(12).toString("hex"); // ~32 chars

    // 2️⃣ Hash the key before storing
    const keyHash = crypto
      .createHash("sha256")
      .update(rawKey)
      .digest("hex");

    // 3️⃣ Store in DB
    const { data, error } = await supabase.from("api_keys").insert({
      user_id,
      key_hash: keyHash,
      name: name || "default",
      is_active: true,
    });

    if (error) {
      console.error("DB error:", error);
      return NextResponse.json(
        { message: "Failed to create API key" },
        { status: 500 }
      );
    }

    // 4️⃣ Return RAW key (never store or show again)
    return NextResponse.json({
      api_key: rawKey,
      warning: "Store this key securely. You will not be able to see it again.",
    });
  } catch (err) {
    console.error("Create API key error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
