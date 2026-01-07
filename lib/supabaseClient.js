import { createClient } from "@supabase/supabase-js";

const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase_service_role_key = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

export const supabase = createClient(supabase_url, supabase_service_role_key);