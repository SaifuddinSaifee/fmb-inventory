type AppConfig = {
  supabaseUrl: string;
  supabaseKey: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in environment"
  );
}

if (!supabaseKey) {
  throw new Error(
    "Missing SUPABASE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment"
  );
}

export const config: AppConfig = {
  supabaseUrl,
  supabaseKey,
};
