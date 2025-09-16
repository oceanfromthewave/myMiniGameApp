import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.SUPABASE_URL;
const anon = import.meta.env.SUPABASE_ANON_KEY;

let supabase;
if (url && anon) {
  supabase = createClient(url, anon, { auth: { persistSession: false } });
} else {
  console.warn("Supabase env missing. Leaderboard disabled.");
  supabase = {
    from() {
      return {
        insert: async () => ({ error: { message: "disabled" } }),
        select: async () => ({ data: [], error: null }),
        eq() {
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
      };
    },
  };
}

export { supabase };
