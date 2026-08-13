import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPublicToken } from './token';

export interface PublicReportItem {
  name: string;
  imageUrl: string | null;
  quantity: number;
}

export interface PublicReport {
  sessionId: string;
  reportNumber: string;
  generatedAt: string;
  performedBy: string;
  signature: string | null;
  signatureImage: string | null;
  notes: string | null;
  bakeryName: string;
  logoUrl: string | null;
  imageUrl: string | null;
  items: PublicReportItem[];
  totalReferences: number;
  totalUnits: number;
}

interface RawReport {
  sessionId: string;
  reportNumber: string;
  generatedAt: string;
  performedBy: string;
  signature: string | null;
  signatureImage: string | null;
  notes: string | null;
  bakeryName: string;
  logoUrl: string | null;
  imageUrl: string | null;
  items: PublicReportItem[] | null;
}

/**
 * Unico punto de lectura del reporte publico: la pagina y el PDF consumen este
 * mismo DTO, de modo que no puedan divergir. La funcion SQL devuelve solo campos
 * permitidos y filtra los revocados.
 */
export async function getPublicReport(token: string): Promise<PublicReport | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc('get_public_report', {
    p_token_hash: hashPublicToken(token),
  });

  if (error || !data) {
    return null;
  }

  const raw = data as RawReport;
  const items = raw.items ?? [];

  return {
    sessionId: raw.sessionId,
    reportNumber: raw.reportNumber,
    generatedAt: raw.generatedAt,
    performedBy: raw.performedBy,
    signature: raw.signature,
    signatureImage: raw.signatureImage ?? null,
    notes: raw.notes,
    bakeryName: raw.bakeryName,
    logoUrl: raw.logoUrl,
    imageUrl: raw.imageUrl ?? null,
    items,
    totalReferences: items.length,
    totalUnits: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
