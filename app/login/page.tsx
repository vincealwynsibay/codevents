import { redirect } from "next/navigation";
import { getViewer } from "@/lib/server/auth";
import SignInCard from "@/components/auth/SignInCard";
import { ALLOWED_EMAIL_DOMAIN, safeNextPath } from "@/lib/domain";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  const viewer = await getViewer();
  if (viewer) redirect(target);

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <SignInCard next={target} domain={ALLOWED_EMAIL_DOMAIN} />
    </div>
  );
}
