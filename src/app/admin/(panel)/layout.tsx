import type { Metadata } from "next";
import { requireStaff, ROLE_LABEL } from "@/lib/auth/staff";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOut } from "@/lib/admin/auth-actions";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · New Life Global" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-ink lg:grid lg:grid-cols-[16.5rem_1fr]">
      <a href="#admin-main" className="nl-skip">Skip to content</a>
      <AdminNav
        isAdmin={staff.isAdmin}
        canEditContent={staff.canEditContent}
        canReadPrayer={staff.canReadPrayer}
        canManageFinance={staff.canManageFinance}
        user={{ name: staff.name, email: staff.email, roles: staff.roles.map((r) => ROLE_LABEL[r]) }}
        signOut={signOut}
      />
      <main id="admin-main" className="min-w-0 px-4 pb-16 pt-6 sm:px-8 lg:px-10 lg:pt-10">{children}</main>
    </div>
  );
}
