import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/utils/supabase";

export async function POST(req: Request) {
  try {
    /* ===============================
       1️⃣ Parse Multipart Form
    =============================== */
    const formData = await req.formData();

    const rawApiKey = formData.get("api_key") as string | null;
    const file = formData.get("file") as File | null;

    if (!rawApiKey) {
      return NextResponse.json(
        { message: "api_key is required" },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json({ message: "File missing" }, { status: 400 });
    }

    /* ===============================
       2️⃣ Hash API Key
    =============================== */
    const keyHash = crypto.createHash("sha256").update(rawApiKey).digest("hex");

    /* ===============================
       3️⃣ Validate API Key
    =============================== */
    const { data: apiKey, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("user_id, is_active")
      .eq("key_hash", keyHash)
      .single();

    if (apiKeyError || !apiKey || !apiKey.is_active) {
      return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
    }

    /* ===============================
       4️⃣ Fetch User
    =============================== */
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", apiKey.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    /* ===============================
       5️⃣ Build Storage Path
    =============================== */
    const ext = file.name.split(".").pop();

    // 8 chars = ~4 billion combinations (safe)
    const shortId = crypto.randomUUID().slice(0, 8);

    const fileName = `${shortId}.${ext}`;
    const storagePath = `${user.username}/${fileName}`;
    /* ===============================
       6️⃣ Upload to Supabase Storage
    =============================== */
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json({ message: "Upload failed" }, { status: 500 });
    }

    /* ===============================
       7️⃣ Response
    =============================== */
    return NextResponse.json({
      success: true,
      path: storagePath,
      url: `/images/${storagePath}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
