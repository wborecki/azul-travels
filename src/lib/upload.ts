import { supabase } from "@/integrations/supabase/client";

export async function uploadToBucket(
  bucket: string,
  file: File,
  prefixo?: string,
  extPadrao = "jpg",
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || extPadrao;
  const nome = `${crypto.randomUUID()}.${ext}`;
  const path = prefixo ? `${prefixo}/${nome}` : nome;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
