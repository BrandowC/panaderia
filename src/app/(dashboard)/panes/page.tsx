import type { Metadata } from 'next';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/features/products/product-form';
import { ProductList } from '@/features/products/product-list';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';
import { listProducts } from '@/server/repositories/products';

export const metadata: Metadata = {
  title: 'Panes | Inventario de Panadería',
};

export default async function ProductsPage() {
  await requireUser();

  const supabase = await createSupabaseServerClient();
  const products = await listProducts(supabase);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Catálogo"
        title="Panes"
        description="Toma la foto de cada pan para reconocerlo al contar."
      />

      <Card aura>
        <CardTitle>Nuevo pan</CardTitle>
        <CardDescription className="mb-4">El nombre no puede repetirse.</CardDescription>
        <ProductForm />
      </Card>

      <ProductList products={products} />
    </div>
  );
}
