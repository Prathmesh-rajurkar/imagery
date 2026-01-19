import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ username: string; image_id: string }> }
) {
  const { username, image_id } = await context.params;

  /**
   * We store images in S3 as:
   * images/{username}/{image_id}
   */
  const storagePath = `images/${username}/${image_id}`;

  /**
   * Build CloudFront URL
   */
  const cdnUrl = `${process.env.CLOUDFRONT_URL}/${storagePath}`;

  /**
   * Redirect to CloudFront (BEST PRACTICE)
   */
  return NextResponse.redirect(cdnUrl, {
    status: 302, // temporary redirect (cache-friendly)
  });
}
