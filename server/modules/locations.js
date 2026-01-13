import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { locationNodes, locations } from '../db/schema.js';
import { pteroApplicationRequest } from '../utils/importer.js';

function mapLocation(item) {
  const a = item?.attributes ?? {};
  return {
    id: a.id,
    shortCode: a.short,
    description: a.long
  };
}

function mapNode(item) {
  const a = item?.attributes ?? {};
  return {
    id: a.id,
    name: a.name,
    fqdn: a.fqdn,
    description: String(a.description ?? ''),
    locationId: a.location_id
  };
}

async function fetchAllPages(fetchPage, { perPage = 100 } = {}) {
  const first = await fetchPage({ page: 1, perPage });
  const data = Array.isArray(first?.data) ? first.data : [];
  const meta = first?.meta;
  const totalPages = Number(meta?.pagination?.total_pages ?? 1);

  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return { data, meta };
  }

  const pages = [];
  for (let p = 2; p <= totalPages; p++) pages.push(p);

  const rest = await Promise.all(pages.map(page => fetchPage({ page, perPage })));
  const merged = [...data];

  for (const r of rest) {
    if (Array.isArray(r?.data)) merged.push(...r.data);
  }

  return { data: merged, meta };
}

function fetchLocationsPage({ page, perPage }) {
  return pteroApplicationRequest({
    path: '/api/application/locations',
    query: { page, per_page: perPage }
  });
}

function fetchNodesPage({ page, perPage }) {
  return pteroApplicationRequest({
    path: '/api/application/nodes',
    query: { page, per_page: perPage, include: 'location' }
  });
}

export async function listLocations({ page = 1, perPage = 50 } = {}) {
  const perPageClamped = Math.min(100, Math.max(1, Number(perPage) || 50));

  const locationsRes = await pteroApplicationRequest({
    path: '/api/application/locations',
    query: { page, per_page: perPageClamped }
  });

  const nodeRes = await fetchAllPages(fetchNodesPage, { perPage: 100 });
  const nodes = Array.isArray(nodeRes?.data) ? nodeRes.data.map(mapNode) : [];

  const nodesByLocationId = new Map();
  for (const n of nodes) {
    const locId = Number(n.locationId);
    if (!Number.isInteger(locId) || locId <= 0) continue;
    if (!nodesByLocationId.has(locId)) nodesByLocationId.set(locId, []);
    nodesByLocationId.get(locId).push({ id: n.id, name: n.name, fqdn: n.fqdn, description: n.description });
  }

  const locationsList = Array.isArray(locationsRes?.data) ? locationsRes.data.map(mapLocation) : [];
  const out = locationsList.map(l => ({
    id: l.id,
    shortCode: l.shortCode,
    description: l.description,
    nodes: nodesByLocationId.get(l.id) || []
  }));

  return { locations: out, meta: locationsRes?.meta ?? null };
}

export async function getLocationDetails({ locationId }) {
  const id = Number(locationId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('locationId is required');

  const locRes = await pteroApplicationRequest({
    path: `/api/application/locations/${id}`
  });

  const loc = mapLocation(locRes);

  const nodeRes = await fetchAllPages(fetchNodesPage, { perPage: 100 });
  const nodes = Array.isArray(nodeRes?.data)
    ? nodeRes.data.map(mapNode).filter(n => Number(n.locationId) === id).map(n => ({ id: n.id, name: n.name, fqdn: n.fqdn, description: n.description }))
    : [];

  return { id: loc.id, shortCode: loc.shortCode, description: loc.description, nodes };
}

export async function listImportedLocations() {
  const locationRows = await db.select().from(locations);
  const nodeRows = await db.select().from(locationNodes);

  const nodesByLocationId = new Map();
  for (const node of nodeRows) {
    if (!nodesByLocationId.has(node.locationId)) nodesByLocationId.set(node.locationId, []);
    nodesByLocationId.get(node.locationId).push({
      id: node.id,
      name: node.name,
      fqdn: node.fqdn,
      description: node.description
    });
  }

  return locationRows.map(loc => ({
    id: loc.id,
    shortCode: loc.shortCode,
    description: loc.description,
    nodes: nodesByLocationId.get(loc.id) || []
  }));
}

export async function deleteImportedLocation({ locationId }) {
  const id = Number(locationId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('locationId is required');

  await db.delete(locationNodes).where(eq(locationNodes.locationId, id));
  await db.delete(locations).where(eq(locations.id, id));

  return { id };
}

export async function importLocationToDb({ locationId }) {
  const details = await getLocationDetails({ locationId });
  const id = Number(details?.id);
  const shortCode = String(details?.shortCode ?? '').trim();
  const description = String(details?.description ?? '').trim();
  const nodes = Array.isArray(details?.nodes) ? details.nodes : [];

  if (!Number.isInteger(id) || id <= 0 || !shortCode) throw new Error('invalid location');

  const existing = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  if (existing.length) {
    await db.update(locations).set({ shortCode, description }).where(eq(locations.id, id));
  } else {
    await db.insert(locations).values({ id, shortCode, description });
  }

  await db.delete(locationNodes).where(eq(locationNodes.locationId, id));

  const nodeIds = [];
  for (const n of nodes) {
    const nodeId = Number(n.id);
    if (!Number.isInteger(nodeId) || nodeId <= 0) continue;

    nodeIds.push(nodeId);

    const row = {
      id: nodeId,
      locationId: id,
      name: String(n.name ?? ''),
      fqdn: String(n.fqdn ?? ''),
      description: String(n.description ?? '')
    };

    const existingNode = await db.select().from(locationNodes).where(eq(locationNodes.id, nodeId)).limit(1);
    if (existingNode.length) {
      await db.update(locationNodes).set(row).where(eq(locationNodes.id, nodeId));
    } else {
      await db.insert(locationNodes).values(row);
    }
  }

  return { id, shortCode, nodeIds };
}
