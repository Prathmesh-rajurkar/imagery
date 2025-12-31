import { supabase } from "@/utils/supabase";

export async function GET(){
    try {
        const res = await supabase.storage
            .from("images")
            .list("", { limit: 100 });

        console.log("Supabase Storage Images:", res);
        return new Response(JSON.stringify(res), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching images:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch images" }), {
            headers: { "Content-Type": "application/json" },
        });
    }
}