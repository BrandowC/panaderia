import type { Metadata } from 'next';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { UserForm } from '@/features/users/user-form';
import { UserList } from '@/features/users/user-list';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';
import { listStaff } from '@/server/repositories/users';

export const metadata: Metadata = {
  title: 'Empleados | Inventario de Panadería',
};

export default async function StaffPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const staff = await listStaff(supabase);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Equipo"
        title="Empleados"
        description="Las cuentas solo se crean desde aquí. No existe registro público."
      />

      <Card aura>
        <CardTitle>Nuevo empleado</CardTitle>
        <CardDescription className="mb-4">
          Toma su foto y entrégale la contraseña en persona.
        </CardDescription>
        <UserForm />
      </Card>

      <UserList staff={staff} currentUserId={user.id} />
    </div>
  );
}
