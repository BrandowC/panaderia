import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors/app-error';
import type { InventoryStatus } from '@/types';

export interface InventoryItem {
  id: string;
  productId: string | null;
  name: string;
  imageUrl: string | null;
  quantity: number;
}

export interface InventorySession {
  id: string;
  status: InventoryStatus;
  performedBy: string;
  notes: string | null;
  startedAt: string;
  finalizedAt: string | null;
}

interface SessionRow {
  id: string;
  status: InventoryStatus;
  performed_by: string;
  notes: string | null;
  started_at: string;
  finalized_at: string | null;
}

interface ItemRow {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  image_snapshot: string | null;
  quantity: number;
}

const SESSION_COLUMNS = 'id, status, performed_by, notes, started_at, finalized_at';
const ITEM_COLUMNS = 'id, product_id, product_name_snapshot, image_snapshot, quantity';

function toSession(row: SessionRow): InventorySession {
  return {
    id: row.id,
    status: row.status,
    performedBy: row.performed_by,
    notes: row.notes,
    startedAt: row.started_at,
    finalizedAt: row.finalized_at,
  };
}

function toItem(row: ItemRow): InventoryItem {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.product_name_snapshot,
    imageUrl: row.image_snapshot,
    quantity: row.quantity,
  };
}

export async function findDraftSession(
  supabase: SupabaseClient,
  userId: string,
): Promise<InventorySession | null> {
  const { data, error } = await supabase
    .from('inventory_sessions')
    .select(SESSION_COLUMNS)
    .eq('performed_by', userId)
    .eq('status', 'DRAFT')
    .maybeSingle();

  if (error) {
    throw new AppError('UNEXPECTED', { cause: error });
  }

  return data ? toSession(data as SessionRow) : null;
}

export async function findSessionById(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<InventorySession | null> {
  const { data, error } = await supabase
    .from('inventory_sessions')
    .select(SESSION_COLUMNS)
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    throw new AppError('UNEXPECTED', { cause: error });
  }

  return data ? toSession(data as SessionRow) : null;
}

/**
 * Crea el conteo copiando el catalogo activo como snapshot. Renombrar o archivar
 * un producto despues no altera este conteo ni su reporte.
 */
export async function createSessionWithSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<InventorySession> {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (productsError) {
    throw new AppError('UNEXPECTED', { cause: productsError });
  }

  if (!products || products.length === 0) {
    throw new AppError('VALIDATION', {
      userMessage: 'No hay productos activos. Pide a la administración que cree el catálogo.',
    });
  }

  const { data: session, error: sessionError } = await supabase
    .from('inventory_sessions')
    .insert({ performed_by: userId })
    .select(SESSION_COLUMNS)
    .single();

  if (sessionError) {
    // 23505: ya existe un borrador abierto para este usuario.
    if (sessionError.code === '23505') {
      throw new AppError('CONFLICT', { userMessage: 'Ya tienes un conteo abierto.' });
    }
    throw new AppError('UNEXPECTED', { cause: sessionError });
  }

  const rows = (
    products as { id: string; name: string; image_url: string | null; sort_order: number }[]
  ).map((product) => ({
    session_id: session.id,
    product_id: product.id,
    product_name_snapshot: product.name,
    image_snapshot: product.image_url,
    sort_order_snapshot: product.sort_order,
    quantity: 0,
  }));

  const { error: itemsError } = await supabase.from('inventory_items').insert(rows);

  if (itemsError) {
    await supabase.from('inventory_sessions').delete().eq('id', session.id);
    throw new AppError('UNEXPECTED', { cause: itemsError });
  }

  return toSession(session as SessionRow);
}

export async function listSessionItems(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(ITEM_COLUMNS)
    .eq('session_id', sessionId)
    .order('sort_order_snapshot', { ascending: true })
    .order('product_name_snapshot', { ascending: true });

  if (error) {
    throw new AppError('UNEXPECTED', { cause: error });
  }

  return (data as ItemRow[]).map(toItem);
}

export async function updateItemQuantity(
  supabase: SupabaseClient,
  itemId: string,
  quantity: number,
): Promise<void> {
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ quantity })
    .eq('id', itemId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new AppError('FORBIDDEN', {
      userMessage: 'No se pudo guardar. El conteo puede estar finalizado.',
      cause: error,
    });
  }

  if (!data) {
    throw new AppError('NOT_FOUND', { userMessage: 'No encontramos ese producto en el conteo.' });
  }
}
