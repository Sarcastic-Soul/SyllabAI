// Kept apart from session.ts so client components can import it.

export const ADMIN_EMAIL = "anishisbusy@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL;
}
