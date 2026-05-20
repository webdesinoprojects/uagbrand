import { redirect } from "next/navigation";
import { connection } from "next/server";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  getCurrentAdminActor,
  isStaffRole,
} from "@/server/supabase/auth";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  await connection();
  const actor = await getCurrentAdminActor();

  if (actor?.isActive && isStaffRole(actor.role)) {
    redirect("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface-soft px-4 py-10 text-foreground">
      <AdminLoginForm />
    </main>
  );
}
