import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./server";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/** The signed-in user, or null. Cached for the length of one request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Reading headers first marks the route as dynamic before the session lookup
  await headers();

  const { data: session } = await auth.getSession();
  if (!session?.user) return null;

  const { id, email, name, image } = session.user;
  return { id, email, name: name || null, image: image ?? null };
});

export async function getUserId(): Promise<string | null> {
  return (await getSessionUser())?.id ?? null;
}
