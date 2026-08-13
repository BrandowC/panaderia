export const INVENTORY_STATUSES = ['DRAFT', 'FINALIZED', 'CANCELLED'] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

/** Limite superior de una cantidad contada. Se refleja en un CHECK de la base. */
export const DEFAULT_MAX_QUANTITY = 99_999;
