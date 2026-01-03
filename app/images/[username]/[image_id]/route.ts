import { supabase } from "@/utils/supabase";


export async function GET(
  req: Request,
  context: { params: Promise<{ username: string; image_id: string }> }
) {
  // console.log(params);

  const { username, image_id } = await context.params;


  const storagePath = `${username}/${image_id}`;
  console.log(storagePath);
  
  
  const { data, error } = await supabase.storage
    .from("images")
    .download(storagePath);

  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  
  const buffer = Buffer.from(await data.arrayBuffer());


  const contentType = data.type || "application/octet-stream";

  
  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
