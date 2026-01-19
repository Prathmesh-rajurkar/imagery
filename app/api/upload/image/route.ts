import { NextResponse } from "next/server";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/utils/s3";
import { supabase } from "@/utils/supabase";

const IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function POST(req: Request) {
  try {
    const { api_key, file_name } = await req.json();

    if (!api_key || !file_name) {
      return NextResponse.json(
        { message: "api_key and file_name are required" },
        { status: 400 }
      );
    }

    const ext = file_name.split(".").pop()?.toLowerCase();
    if (!ext || !IMAGE_MIME[ext]) {
      return NextResponse.json(
        { message: "Unsupported image format" },
        { status: 400 }
      );
    }

    /* API key validation */
    const keyHash = crypto.createHash("sha256").update(api_key).digest("hex");

    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("user_id, is_active")
      .eq("key_hash", keyHash)
      .single();

    if (!apiKey?.is_active) {
      return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("username")
      .eq("id", apiKey.user_id)
      .single();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const key = `images/${user.username}/${id}.${ext}`;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        ContentType: IMAGE_MIME[ext],
      }),
      { expiresIn: 60 }
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
      path: key,
      url: `${process.env.APP_BASE_URL}/${key}`,
      type: "image",
    });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
