import { SignIn } from "@clerk/nextjs";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    redirect("/admin/events");
  }

  return (
    <div className="min-h-screen">
      <div className="w-full grid place-items-center">
        <SignIn />
      </div>
    </div>
  );
}
