import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";
import { Database } from "@/lib/supabaseType";

export const supabase = createClient<Database>(
  config.supabaseUrl,
  config.supabaseKey
);
