import { supabase } from "./supabase";

const LEGACY_PUBLIC_MARKER = "/storage/v1/object/public/comprovantes/";

export function comprovantePath(value: string): string {
  const markerIndex = value.indexOf(LEGACY_PUBLIC_MARKER);
  const rawPath =
    markerIndex >= 0
      ? value.slice(markerIndex + LEGACY_PUBLIC_MARKER.length).split(/[?#]/, 1)[0]
      : value;
  const path = decodeURIComponent(rawPath).replace(/^\/+/, "");
  if (!path || path.includes("..") || !path.includes("/")) {
    throw new Error("Caminho de comprovante inválido.");
  }
  return path;
}

export async function openComprovante(value: string): Promise<void> {
  const popup = window.open("about:blank", "_blank");
  if (!popup) throw new Error("O navegador bloqueou a nova janela.");
  popup.opener = null;
  try {
    const { data, error } = await supabase.storage
      .from("comprovantes")
      .createSignedUrl(comprovantePath(value), 60);
    if (error || !data.signedUrl) throw new Error("Não foi possível abrir o comprovante.");
    popup.location.href = data.signedUrl;
  } catch (error) {
    popup?.close();
    throw error;
  }
}
