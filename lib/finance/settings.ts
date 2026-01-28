import { createClient } from "@/lib/supabase/server";

export async function getPaymentMode(): Promise<"test" | "live"> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("school_settings")
        .select("payment_mode")
        .single();

    return (data?.payment_mode as "test" | "live") || "test";
}
