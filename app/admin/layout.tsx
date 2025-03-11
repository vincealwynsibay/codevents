import { requireAdminPage } from "@/lib/server/auth";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireAdminPage();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-primary/40 bg-primary/15 px-2 py-0.5 font-chakra text-xs font-bold uppercase tracking-widest text-blue-200">
            {viewer.role === "OWNER" ? "Owner" : "Officer"}
          </span>
          <AdminNav isOwner={viewer.role === "OWNER"} />
        </div>
      </div>
      {children}
    </div>
  );
}
