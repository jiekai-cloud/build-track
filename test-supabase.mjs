import { createClient } from "@supabase/supabase-js";
import fs from "fs";

function getEnv() {
  const content = fs.readFileSync(".env.local", "utf8");
  return Object.fromEntries(
    content.split("\n")
      .filter(line => line && !line.startsWith("#"))
      .map(line => line.split("=").map(p => p.trim()))
  );
}

const env = getEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function fix() {
  const collections = ["vendors", "quotations"];
  for (const collection of collections) {
    const { data, error } = await supabase.from("app_data").select("item_id, data").eq("collection", collection);
    if (error) { console.error(error); continue; }
    
    const needsUpdate = data.filter(r => !r.data.departmentId);
    if (needsUpdate.length === 0) {
      console.log(`No null departmentId in ${collection}`);
      continue;
    }
    
    console.log(`Fixing ${needsUpdate.length} items in ${collection}...`);
    for (const r of needsUpdate) {
      r.data.departmentId = "DEPT-4";
      await supabase.from("app_data").upsert({
        collection,
        item_id: r.item_id,
        data: r.data
      });
    }
    console.log(`Fixed ${collection}`);
  }
}
fix();
