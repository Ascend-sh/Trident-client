import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { eggs, nestEggs, nests } from '../db/schema.js';
import { pteroApplicationRequest } from '../utils/importer.js';

function mapNestSummary(item) {
  const a = item?.attributes ?? {};
  return {
    id: a.id,
    uuid: a.uuid,
    name: a.name,
    description: a.description
  };
}

function mapEgg(item) {
  const a = item?.attributes ?? {};
  return {
    id: a.id,
    uuid: a.uuid,
    name: a.name,
    nest: a.nest,
    author: a.author,
    description: a.description,
    docker_image: a.docker_image,
    startup: a.startup,
    created_at: a.created_at,
    updated_at: a.updated_at
  };
}

export async function listNests({ page = 1, perPage = 50 } = {}) {
  const res = await pteroApplicationRequest({
    path: '/api/application/nests',
    query: { page, per_page: perPage }
  });

  return {
    nests: Array.isArray(res?.data) ? res.data.map(mapNestSummary) : [],
    meta: res?.meta ?? null
  };
}

export async function getNestDetails({ nestId }) {
  const id = Number(nestId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('nestId is required');

  const res = await pteroApplicationRequest({
    path: `/api/application/nests/${id}`,
    query: { include: 'eggs' }
  });

  const attrs = res?.attributes ?? {};
  const eggsList = attrs?.relationships?.eggs?.data;

  return {
    id: attrs.id,
    uuid: attrs.uuid,
    name: attrs.name,
    description: attrs.description,
    eggs: Array.isArray(eggsList) ? eggsList.map(mapEgg) : []
  };
}

export async function listImportedNests() {
  const nestRows = await db.select().from(nests);
  const mappingRows = await db.select().from(nestEggs);
  const eggRows = await db.select().from(eggs);

  const eggById = new Map(eggRows.map(e => [e.id, e]));
  const eggIdsByNest = new Map();

  for (const m of mappingRows) {
    if (!eggIdsByNest.has(m.nestId)) eggIdsByNest.set(m.nestId, []);
    eggIdsByNest.get(m.nestId).push(m.eggId);
  }

  return nestRows.map(n => {
    const ids = eggIdsByNest.get(n.id) || [];
    return {
      id: n.id,
      name: n.name,
      description: n.description,
      eggCount: ids.length,
      eggs: ids.map(id => {
        const e = eggById.get(id);
        if (!e) return null;
        return {
          id: e.id,
          name: e.name,
          author: e.author,
          dockerImage: e.dockerImage,
          startup: e.startup,
          description: e.description
        };
      }).filter(Boolean)
    };
  });
}

export async function deleteImportedNest({ nestId }) {
  const id = Number(nestId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('nestId is required');

  await db.delete(nestEggs).where(eq(nestEggs.nestId, id));
  await db.delete(eggs).where(eq(eggs.nestId, id));
  await db.delete(nests).where(eq(nests.id, id));

  return { id };
}

export async function importNestToDb({ nestId }) {
  const details = await getNestDetails({ nestId });
  const id = Number(details?.id);
  const name = String(details?.name ?? '').trim();
  const description = String(details?.description ?? '').trim();
  const panelEggs = Array.isArray(details?.eggs) ? details.eggs : [];
  const eggIds = panelEggs.map(e => Number(e.id)).filter(n => Number.isInteger(n) && n > 0);

  if (!Number.isInteger(id) || id <= 0 || !name) throw new Error('invalid nest');

  const existing = await db.select().from(nests).where(eq(nests.id, id)).limit(1);
  if (existing.length) {
    await db.update(nests).set({ name, description }).where(eq(nests.id, id));
  } else {
    await db.insert(nests).values({ id, name, description });
  }

  await db.delete(nestEggs).where(eq(nestEggs.nestId, id));
  if (eggIds.length) {
    await db.insert(nestEggs).values(eggIds.map(eggId => ({ nestId: id, eggId })));
  }

  for (const e of panelEggs) {
    const eggId = Number(e.id);
    if (!Number.isInteger(eggId) || eggId <= 0) continue;

    let envVars = [];
    try {
      const eggDetails = await pteroApplicationRequest({
        path: `/api/application/nests/${id}/eggs/${eggId}`,
        query: { include: 'variables,nest' }
      });

      const varsList = eggDetails?.attributes?.relationships?.variables?.data;
      if (Array.isArray(varsList)) {
        envVars = varsList
          .map((v) => v?.attributes)
          .filter((v) => v && typeof v === 'object');
      }
    } catch {
      envVars = [];
    }

    const row = {
      id: eggId,
      nestId: id,
      uuid: String(e.uuid ?? ''),
      name: String(e.name ?? ''),
      description: String(e.description ?? ''),
      dockerImage: e.docker_image ?? null,
      startup: e.startup ?? null,
      author: e.author ?? null,
      envVars: JSON.stringify(envVars),
      createdAt: e.created_at ?? null,
      updatedAt: e.updated_at ?? null
    };

    const existingEgg = await db.select().from(eggs).where(eq(eggs.id, eggId)).limit(1);
    if (existingEgg.length) {
      await db.update(eggs).set(row).where(eq(eggs.id, eggId));
    } else {
      await db.insert(eggs).values(row);
    }
  }

  return { id, name, eggIds };
}
