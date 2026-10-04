import { notFound } from "next/navigation";
import { AccountView } from "@neondatabase/auth-ui";
import { accountViewPaths } from "@neondatabase/auth-ui/server";

const viewPaths: string[] = Object.values(accountViewPaths);

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  if (!viewPaths.includes(path)) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">Account</h1>
      <AccountView path={path} />
    </main>
  );
}
