import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  console.log(userId);

  if (!userId) {
    redirect("/");
  }
  return <div>{children}</div>;
}
