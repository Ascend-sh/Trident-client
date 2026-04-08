import { db } from '../db/client.js';
import { users, servers } from '../db/schema.js';
import { eq, like, sql, asc, desc } from 'drizzle-orm';

export async function listLocalUsers({ page = 1, perPage = 50, filter, sort } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const pp = Math.min(100, Math.max(1, Number(perPage) || 50));
  const offset = (p - 1) * pp;

  let query = db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      serverCount: sql`(SELECT COUNT(*) FROM servers WHERE servers.user_id = ${users.id})`.as('server_count')
    })
    .from(users);

  if (filter?.username) {
    query = query.where(like(users.username, `%${filter.username}%`));
  } else if (filter?.email) {
    query = query.where(like(users.email, `%${filter.email}%`));
  }

  const sortDir = sort?.startsWith('-') ? desc : asc;
  const sortField = (sort || 'id').replace(/^-/, '');
  const sortMap = {
    id: users.id,
    username: users.username,
    email: users.email,
    created_at: users.createdAt
  };
  const sortCol = sortMap[sortField] || users.id;
  query = query.orderBy(sortDir(sortCol));

  const countResult = await db.select({ count: sql`COUNT(*)` }).from(users);
  const total = Number(countResult[0]?.count) || 0;
  const totalPages = Math.ceil(total / pp) || 1;

  const rows = await query.limit(pp).offset(offset);

  const mapped = rows.map(r => ({
    id: r.id,
    username: r.username,
    email: r.email,
    isAdmin: Boolean(r.isAdmin),
    has2fa: Boolean(r.has2fa),
    createdAt: r.createdAt,
    serverCount: Number(r.serverCount) || 0
  }));

  return {
    users: mapped,
    pagination: {
      total,
      count: mapped.length,
      perPage: pp,
      currentPage: p,
      totalPages
    }
  };
}

export async function getLocalUser({ userId }) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('invalid_user_id');

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      isAdmin: users.isAdmin,
      has2fa: users.has2fa,
      createdAt: users.createdAt,
      serverCount: sql`(SELECT COUNT(*) FROM servers WHERE servers.user_id = ${users.id})`.as('server_count')
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!rows.length) {
    const err = new Error('user_not_found');
    err.status = 404;
    throw err;
  }

  const r = rows[0];
  return {
    user: {
      id: r.id,
      username: r.username,
      email: r.email,
      isAdmin: Boolean(r.isAdmin),
      has2fa: Boolean(r.has2fa),
      createdAt: r.createdAt,
      serverCount: Number(r.serverCount) || 0
    }
  };
}
