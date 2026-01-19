import { NextResponse } from "next/server";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/utils/s3";
import { supabase } from "@/utils/supabase";

const VIDEO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  flv: "video/x-flv",
  wmv: "video/x-ms-wmv",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
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
    if (!ext || !VIDEO_MIME[ext]) {
      return NextResponse.json(
        { message: "Unsupported video format" },
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
    const key = `videos/${user.username}/${id}.${ext}`;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        ContentType: VIDEO_MIME[ext],
      }),
      { expiresIn: 120 }
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
      path: key,
      url: `${process.env.APP_BASE_URL}/${key}`,
      type: "video",
    });
  } catch (err) {
    console.error("Video upload error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
