"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { companions, sessionHistory } from "@/lib/db/schema";
import { eq, ilike, or, desc, and, count } from "drizzle-orm";

// Create a new companion
export const createCompanion = async (formData: CreateCompanion) => {
  const { userId: author } = await auth();

  if (!author) throw new Error("Unauthorized");

  const [data] = await db
    .insert(companions)
    .values({ ...formData, author })
    .returning();

  if (!data) throw new Error("Failed to create a companion");

  return data;
};

// Fetch all companions with optional filters
export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
}: GetAllCompanions) => {
  await auth(); // Optional: for session validation

  const offset = (page - 1) * limit;

  let whereClause = undefined;

  if (subject && topic) {
    whereClause = and(
      ilike(companions.subject, `%${subject}%`),
      or(
        ilike(companions.topic, `%${topic}%`),
        ilike(companions.name, `%${topic}%`),
      ),
    );
  } else if (subject) {
    whereClause = ilike(companions.subject, `%${subject}%`);
  } else if (topic) {
    whereClause = or(
      ilike(companions.topic, `%${topic}%`),
      ilike(companions.name, `%${topic}%`),
    );
  }

  const data = await db
    .select()
    .from(companions)
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  return data;
};

// Get a single companion by ID
export const getCompanion = async (id: string) => {
  const [data] = await db
    .select()
    .from(companions)
    .where(eq(companions.id, id));

  if (!data) throw new Error("Companion not found");

  return data;
};

// Add companion to session history
export const addToSessionHistory = async (companionId: string) => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const [data] = await db
    .insert(sessionHistory)
    .values({
      companionId: companionId,
      userId: userId,
    })
    .returning();

  if (!data) throw new Error("Failed to add to session history");

  return data;
};

// Get recent global sessions
export const getRecentSessions = async (limit = 10) => {
  const data = await db.query.sessionHistory.findMany({
    with: {
      companion: true,
    },
    orderBy: [desc(sessionHistory.createdAt)],
    limit: limit * 3, // Fetch more to account for duplicates
  });

  // Remove duplicates based on companion id and limit the results
  const uniqueCompanions = new Map();

  for (const session of data) {
    const companion = session.companion as any;
    if (companion && companion.id && !uniqueCompanions.has(companion.id)) {
      uniqueCompanions.set(companion.id, companion);
      if (uniqueCompanions.size >= limit) break;
    }
  }

  return Array.from(uniqueCompanions.values());
};

// Get sessions of a specific user
export const getUserSessions = async (userId: string, limit = 10) => {
  const data = await db.query.sessionHistory.findMany({
    where: eq(sessionHistory.userId, userId),
    with: {
      companion: true,
    },
    orderBy: [desc(sessionHistory.createdAt)],
    limit: limit * 3, // Fetch more to account for duplicates
  });

  // Remove duplicates based on companion id and limit the results
  const uniqueCompanions = new Map();

  for (const session of data) {
    const companion = session.companion as any;
    if (companion && companion.id && !uniqueCompanions.has(companion.id)) {
      uniqueCompanions.set(companion.id, companion);
      if (uniqueCompanions.size >= limit) break;
    }
  }

  return Array.from(uniqueCompanions.values());
};

// Get companions created by the user
export const getUserCompanions = async (userId: string) => {
  const data = await db
    .select()
    .from(companions)
    .where(eq(companions.author, userId));

  return data;
};

// Check if user is allowed to create a new companion
export const newCompanionPermissions = async () => {
  const { userId, has } = await auth();

  if (!userId) return false;

  let limit = 0;

  if (has({ plan: "pro" })) {
    return true;
  } else if (has({ feature: "3_companion_limit" })) {
    limit = 3;
  } else if (has({ feature: "10_companion_limit" })) {
    limit = 10;
  }

  const [companionCount] = await db
    .select({ count: count() })
    .from(companions)
    .where(eq(companions.author, userId));

  return companionCount.count < limit;
};

// Toggle bookmark status (set isBookmarked to true/false)
export const toggleBookmark = async (
  companionId: string,
  isBookmarked: boolean,
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  await db
    .update(companions)
    .set({ isBookmarked })
    .where(and(eq(companions.id, companionId), eq(companions.author, userId)));
};

export const getBookmarkedCompanions = async (userId: string) => {
  if (!userId) return [];

  try {
    const data = await db
      .select()
      .from(companions)
      .where(
        and(eq(companions.author, userId), eq(companions.isBookmarked, true)),
      );

    return data;
  } catch (error: any) {
    console.error("Error fetching bookmarked companions:", error.message);
    return [];
  }
};

// Delete a companion (only by the author)
export const deleteCompanion = async (companionId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  // First, verify that the user is the author of the companion
  const [companion] = await db
    .select({ author: companions.author })
    .from(companions)
    .where(eq(companions.id, companionId));

  if (!companion) throw new Error("Companion not found");
  if (companion.author !== userId)
    throw new Error("Not authorized to delete this companion");

  // Delete the companion (this will cascade delete session_history due to foreign key constraint defined in DB)
  await db
    .delete(companions)
    .where(and(eq(companions.id, companionId), eq(companions.author, userId)));

  return { success: true };
};
