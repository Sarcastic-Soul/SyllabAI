"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const syncUserToDatabase = async () => {
  const user = await currentUser();

  if (!user) return;

  const email = user.emailAddresses?.[0]?.emailAddress;
  const id = user.id;

  try {
    await db
      .insert(users)
      .values({
        id,
        email,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { email },
      });
  } catch (error: any) {
    console.error("Error syncing user to database:", error.message);
  }
};
