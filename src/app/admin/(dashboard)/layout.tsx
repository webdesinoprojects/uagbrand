import { redirect } from "next/navigation";
import { connection } from "next/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import type { AdminSessionRole } from "@/types/api";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let actor: Awaited<ReturnType<typeof requireAdminActor>>;

  await connection();

  try {
    actor = await requireAdminActor("staff");
  } catch (error) {
    if (error instanceof AdminAccessError) {
      redirect("/admin/login");
    }

    throw error;
  }

  return (
    <AdminShell
      actor={{
        email: actor.email,
        role: actor.role as AdminSessionRole,
      }}
    >
      {children}
    </AdminShell>
  );
}
