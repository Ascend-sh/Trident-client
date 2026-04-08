import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { economySettings, wallets } from '../db/schema.js';

export async function ensureWallet(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) return { ok: false };

  try {
    await db.insert(wallets).values({ userId: id, balance: 0 });
  } catch {
  }

  return { ok: true };
}

export async function getEconomySettings() {
  const rows = await db.select().from(economySettings).where(eq(economySettings.id, 1)).limit(1);
  const currencyName = String(rows[0]?.currencyName ?? 'TQN');
  return { currencyName };
}

export async function setCurrencyName(currencyName) {
  const clean = String(currencyName ?? '').trim();
  if (!clean) return { ok: false, currencyName: null };

  await db.update(economySettings).set({ currencyName: clean }).where(eq(economySettings.id, 1));
  return { ok: true, currencyName: clean };
}

export async function getBalance(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    const settings = await getEconomySettings();
    return { ...settings, balance: 0 };
  }

  await ensureWallet(id);

  const walletRows = await db.select().from(wallets).where(eq(wallets.userId, id)).limit(1);
  const settings = await getEconomySettings();

  const balance = Number(walletRows[0]?.balance ?? 0);
  return { ...settings, balance };
}

export async function addBalance(userId, amount) {
    const id = Number(userId);
    const val = Math.floor(Number(amount));
    if (val <= 0) return { ok: false, error: 'invalid_amount' };

    await ensureWallet(id);
    const rows = await db.select().from(wallets).where(eq(wallets.userId, id)).limit(1);
    const current = rows[0]?.balance ?? 0;
    
    await db.update(wallets).set({ 
        balance: current + val,
        updatedAt: new Date()
    }).where(eq(wallets.userId, id));

    return { ok: true, newBalance: current + val };
}

export async function subtractBalance(userId, amount) {
    const id = Number(userId);
    const val = Math.floor(Number(amount));
    if (val <= 0) return { ok: false, error: 'invalid_amount' };

    await ensureWallet(id);
    const rows = await db.select().from(wallets).where(eq(wallets.userId, id)).limit(1);
    const current = rows[0]?.balance ?? 0;
    
    if (current < val) return { ok: false, error: 'insufficient_funds' };

    await db.update(wallets).set({ 
        balance: current - val,
        updatedAt: new Date()
    }).where(eq(wallets.userId, id));

    return { ok: true, newBalance: current - val };
}
