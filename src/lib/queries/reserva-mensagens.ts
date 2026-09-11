import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ReservaMensagemRow = Tables<"reserva_mensagens">;

export async function fetchMensagensDaReserva(reservaId: string): Promise<ReservaMensagemRow[]> {
  const { data, error } = await supabase
    .from("reserva_mensagens")
    .select("*")
    .eq("reserva_id", reservaId)
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function enviarMensagemReserva(params: {
  reservaId: string;
  autorId: string;
  corpo: string;
}): Promise<ReservaMensagemRow> {
  const { data, error } = await supabase
    .from("reserva_mensagens")
    .insert({
      reserva_id: params.reservaId,
      autor_id: params.autorId,
      corpo: params.corpo,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function marcarMensagensComoLidas(
  reservaId: string,
  autorIdAtual: string,
): Promise<void> {
  const { error } = await supabase
    .from("reserva_mensagens")
    .update({ lida_em: new Date().toISOString() })
    .eq("reserva_id", reservaId)
    .is("lida_em", null)
    .neq("autor_id", autorIdAtual);

  if (error) throw error;
}

export async function fetchContagemNaoLidasPorReservas(
  reservaIds: ReadonlyArray<string>,
  autorIdAtual: string,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (reservaIds.length === 0) return out;

  const { data, error } = await supabase
    .from("reserva_mensagens")
    .select("reserva_id")
    .in("reserva_id", [...reservaIds])
    .is("lida_em", null)
    .neq("autor_id", autorIdAtual)
    .returns<Pick<ReservaMensagemRow, "reserva_id">[]>();

  if (error) throw error;
  for (const row of data ?? []) {
    out.set(row.reserva_id, (out.get(row.reserva_id) ?? 0) + 1);
  }
  return out;
}

export async function fetchUltimasMensagensPorReservas(
  reservaIds: ReadonlyArray<string>,
): Promise<Map<string, ReservaMensagemRow>> {
  const out = new Map<string, ReservaMensagemRow>();
  if (reservaIds.length === 0) return out;

  const { data, error } = await supabase
    .from("reserva_mensagens")
    .select("*")
    .in("reserva_id", [...reservaIds])
    .order("criado_em", { ascending: false })
    .returns<ReservaMensagemRow[]>();

  if (error) throw error;
  for (const msg of data ?? []) {
    if (!out.has(msg.reserva_id)) out.set(msg.reserva_id, msg);
  }
  return out;
}
