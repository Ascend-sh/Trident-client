import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { HTTP_STATUS, ok, unauthorized, unprocessable, badRequest } from '../middlewares/error-handler.js';

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    isAdmin: Boolean(row.isAdmin),
    createdAt: row.createdAt
  };
}

export async function updateAccount({ userId, username, email, password }) {
  const cleanUsername = username ? String(username).trim() : undefined;
  const cleanEmail = email ? normalizeEmail(email) : undefined;
  const cleanPassword = password ? String(password) : undefined;

  const updates = {};
  if (cleanUsername) updates.username = cleanUsername;
  if (cleanEmail) updates.email = cleanEmail;
  if (cleanPassword) {
    updates.password = await Bun.password.hash(cleanPassword);
  }

  if (Object.keys(updates).length === 0) {
    return badRequest('no_updates_provided');
  }

  try {
    const updated = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    const user = updated[0];
    if (!user) return unauthorized('user_not_found');

    return ok({ user: publicUser(user) }, HTTP_STATUS.OK);
  } catch (err) {
    return unprocessable('update_conflict');
  }
}
