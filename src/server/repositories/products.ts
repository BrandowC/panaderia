import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateProductInput, UpdateProductInput } from '@/features/products/schemas';
import { AppError } from '@/lib/errors/app-error';

export interface Product {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ProductRow {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const COLUMNS = 'id, name, image_url, sort_order, is_active';

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/** Codigo 23505 de Postgres: viola el indice unico de nombre activo. */
function isDuplicateName(code: string | undefined): boolean {
  return code === '23505';
}

const DUPLICATE_MESSAGE = 'Ya existe un producto con ese nombre.';

export async function listProducts(supabase: SupabaseClient): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new AppError('UNEXPECTED', { cause: error });
  }

  return (data as ProductRow[]).map(toProduct);
}

export async function createProduct(
  supabase: SupabaseClient,
  input: CreateProductInput,
  createdBy: string,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      image_url: input.imageUrl,
      sort_order: input.sortOrder,
      created_by: createdBy,
      // normalized_name lo calcula un disparador: no se acepta del cliente.
      normalized_name: '',
    })
    .select(COLUMNS)
    .single();

  if (error) {
    if (isDuplicateName(error.code)) {
      throw new AppError('CONFLICT', { userMessage: DUPLICATE_MESSAGE });
    }
    throw new AppError('UNEXPECTED', { cause: error });
  }

  return toProduct(data as ProductRow);
}

export async function updateProduct(
  supabase: SupabaseClient,
  input: UpdateProductInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      image_url: input.imageUrl,
      sort_order: input.sortOrder,
    })
    .eq('id', input.id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    if (isDuplicateName(error.code)) {
      throw new AppError('CONFLICT', { userMessage: DUPLICATE_MESSAGE });
    }
    throw new AppError('UNEXPECTED', { cause: error });
  }

  // Sin fila devuelta: el id no existe o RLS bloqueo la operacion.
  if (!data) {
    throw new AppError('NOT_FOUND', { userMessage: 'No encontramos ese producto.' });
  }

  return toProduct(data as ProductRow);
}

/**
 * Borra de verdad si el producto nunca se conto. Si ya tiene historial lo oculta,
 * porque borrarlo dejaria reportes antiguos sin ese renglon. La decision la toma
 * la base de datos, no la interfaz.
 */
export async function deleteProduct(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_product', { p_product_id: id });

  if (error) {
    throw new AppError('FORBIDDEN', {
      userMessage: 'No se pudo eliminar el producto.',
      cause: error,
    });
  }
}
