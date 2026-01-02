import { supabase } from "@/utils/supabase";


export async function GET(
  req: Request,
  context: { params: Promise<{ username: string; image_id: string }> }
) {
  // console.log(params);

  const { username, image_id } = await context.params;

  /* ===============================
     1️⃣ Build storage path (KEEP EXTENSION)
  =============================== */
  const storagePath = `${username}/${image_id}`;
  console.log(storagePath);
  
  /* ===============================
     2️⃣ Download from Supabase
  =============================== */
  const { data, error } = await supabase.storage
    .from("images")
    .download(storagePath);

  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  /* ===============================
     3️⃣ Convert to buffer
  =============================== */
  const buffer = Buffer.from(await data.arrayBuffer());

  /* ===============================
     4️⃣ Detect content type
  =============================== */
  const contentType = data.type || "application/octet-stream";

  /* ===============================
     5️⃣ Return image
  =============================== */
  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
