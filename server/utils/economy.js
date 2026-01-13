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
