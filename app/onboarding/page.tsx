import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/server/auth";
import ProfileForm from "@/components/auth/ProfileForm";
import { COURSES, YEAR_LEVELS, profileNeedsUpdate, safeNextPath, schoolYearOf } from "@/lib/domain";

export const metadata = { title: "Your profile" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; edit?: string }>;
}) {
  const { next, edit } = await searchParams;
  const target = safeNextPath(next);
  const viewer = await requireViewer("/onboarding");
  const needsUpdate = profileNeedsUpdate(viewer.profile);
  if (!needsUpdate && !edit) redirect(target);

  const isYearlyCheck = !!viewer.profile && viewer.profile.schoolYear !== schoolYearOf();

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="eyebrow">{isYearlyCheck ? `New school year · ${schoolYearOf()}` : "Almost there"}</p>
      <h1 className="mt-2 font-chakra text-3xl font-bold">
        {isYearlyCheck ? "Still in the same year level?" : edit && !needsUpdate ? "Your profile" : "Tell us about you"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {isYearlyCheck
          ? "It's a new school year. Confirm your course and year level so your sign-ups show the right details."
          : "This goes on your event sign-ups and certificates. You only fill it in once a school year."}
      </p>
      <ProfileForm
        next={target}
        courses={[...COURSES]}
        yearLevels={[...YEAR_LEVELS]}
        initial={{
          name: viewer.profile?.name || viewer.user.name,
          course: viewer.profile?.course || "",
          yearLevel: viewer.profile?.yearLevel || "",
        }}
        email={viewer.user.email}
      />
    </div>
  );
}
