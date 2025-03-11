import { requireOwnerPage } from "@/lib/server/auth";
import { listAdmins } from "@/lib/server/data";
import OfficersManager from "@/components/admin/OfficersManager";

export const metadata = { title: "Officers" };

export default async function OfficersPage() {
  const viewer = await requireOwnerPage();
  const admins = await listAdmins();
  const envOwners = (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Access</p>
        <h1 className="mt-1 font-chakra text-3xl font-bold">Officers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Officers create and run events. Owners can also add and remove officers, so each year&apos;s president
          hands access to the next. People listed here can sign in with their Google account even if it isn&apos;t a
          school email.
        </p>
      </div>
      <OfficersManager admins={admins} envOwners={envOwners} me={viewer.user.email} />
    </div>
  );
}
