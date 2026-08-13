import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type AuditAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'INVENTORY_STARTED'
  | 'INVENTORY_FINALIZED'
  | 'REPORT_REVOKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED';

interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Escribe con privilegios elevados porque no existe politica de INSERT para
 * clientes: asi nadie puede falsificar ni borrar registros de auditoria.
 * Un fallo aqui no debe tumbar la operacion que se estaba auditando.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from('audit_logs').insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (error) {
    console.error('No se pudo registrar la auditoria', {
      action: entry.action,
      entityId: entry.entityId,
      error: error instanceof Error ? error.message : 'desconocido',
    });
  }
}
