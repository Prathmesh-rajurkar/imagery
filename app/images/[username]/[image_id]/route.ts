import { supabase } from "@/utils/supabase";

export async function GET(
  req: Request,
  { params }: { params: { username: string; image_id: string } }
) {
  const { username, image_id } = await params;
  const { data, error } = await supabase.storage
    .from("images")
    .download("fifth_sem.jpeg");

  if (error) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await data.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
