import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { customization } from '../db/schema.js';

export async function ensureCustomization() {
  const rows = await db.select().from(customization).where(eq(customization.id, 1)).limit(1);
  if (rows.length) {
    let updated = false;
    const patch = {};
    if (rows[0].fontFamily === 'Inter') {
      patch.fontFamily = "'Satoshi', sans-serif";
      updated = true;
    }
    if (rows[0].borderRadius === '6px') {
      patch.borderRadius = "0.625rem";
      updated = true;
    }
    if (updated) {
      await db.update(customization).set(patch).where(eq(customization.id, 1));
      return (await db.select().from(customization).where(eq(customization.id, 1)).limit(1))[0];
    }
    return rows[0];
  }

  try {
    await db.insert(customization).values({ 
      id: 1,
      siteName: 'Trident Cloud',
      logoUrl: '/Logo-dark.png',
      brandColor: '#18181b',
      brandColorDark: '#ffffff',
      brandHover: '#27272a',
      brandHoverDark: '#f4f4f5',
      surface: '#ffffff',
      surfaceDark: '#121212',
      surfaceLight: '#f4f4f5',
      surfaceLightDark: '#18181b',
      surfaceHighlight: '#e5e5e5',
      surfaceHighlightDark: '#27272a',
      surfaceLighter: '#e4e4e7',
      surfaceLighterDark: '#3f3f46',
      mutedForeground: '#71717a',
      mutedForegroundDark: '#a1a1aa',
      foreground: '#18181b',
      foregroundDark: '#ffffff',
      borderColor: '#e4e4e7',

      borderColorDark: '#3f3f46',
      borderRadius: '0.625rem',
      fontFamily: "'Satoshi', sans-serif",
      isCompact: true,
      isDark: true
    });
  } catch {
  }

  const after = await db.select().from(customization).where(eq(customization.id, 1)).limit(1);
  return after[0] || null;
}

export async function getCustomization() {
  const row = await ensureCustomization();
  return row;
}

export async function updateCustomization(patch) {
  const current = await getCustomization();
  const next = { ...current, ...patch, id: 1, updatedAt: new Date() };

  // Filter out any extra fields and normalize
  const validFields = [
    'siteName', 'logoUrl', 'brandColor', 'brandColorDark', 'brandHover', 'brandHoverDark',
    'surface', 'surfaceDark', 'surfaceLight', 'surfaceLightDark', 'surfaceHighlight',
    'surfaceHighlightDark', 'surfaceLighter', 'surfaceLighterDark', 'mutedForeground',
    'mutedForegroundDark', 'foreground', 'foregroundDark', 'borderColor', 'borderColorDark', 'borderRadius', 'fontFamily',
    'isCompact', 'isDark'

  ];

  const updateData = {};
  for (const field of validFields) {
    if (patch[field] !== undefined) {
      updateData[field] = patch[field];
    }
  }

  await db.update(customization).set(updateData).where(eq(customization.id, 1));
  const result = await getCustomization();
  return { ok: true, customization: result };
}
