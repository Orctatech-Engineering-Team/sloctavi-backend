import type { Buffer } from "node:buffer";

import { createClient } from "@supabase/supabase-js";

import env from "@/env";

import type { MediaStorage } from "./types";

const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_KEY!);

export class SupabaseStorage implements MediaStorage {
  async uploadFile(userId: string, fileName: string, fileBuffer: Buffer, context: string) {
    const path = `${context}/${userId}/${Date.now()}_${fileName}`;
    const { error } = await supabase.storage
      .from("sloctavi")
      .upload(path, fileBuffer, { upsert: true });
    if (error)
      throw error;
    return supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
  }
}
