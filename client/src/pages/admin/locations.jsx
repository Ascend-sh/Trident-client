import { MapPin, Plus, Ellipsis } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CenterModal from "../../components/modals/center-modal";

const API_BASE = "/api/v1/client";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.error || data?.message || "request_failed";
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
}

function fetchPanelLocations({ page = 1, perPage = 50 } = {}) {
  const qs = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return request(`/admin/panel-locations?${qs}`);
}

function fetchImportedLocations() {
  return request('/admin/imported-locations');
}

function addLocation(locationId) {
  return request('/admin/add-locations', { method: 'POST', body: { id: locationId } });
}

function deleteLocation(locationId) {
  const qs = new URLSearchParams({ id: String(locationId) });
  return request(`/admin/delete-location?${qs}`, { method: 'DELETE' });
}

function normalizeCountryCode(value) {
  const v = String(value ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(v)) return null;
  return v;
}

function CountryFlag({ code, size = 16, className = '' }) {
  const country = useMemo(() => normalizeCountryCode(code), [code]);
  const [failed, setFailed] = useState(false);

  if (!country || failed) {
    return <MapPin size={size} className={className || 'text-muted-foreground/30'} />;
  }

  return (
    <img
      src={`https://flagsapi.com/${country}/flat/64.png`}
      alt={country}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-sm object-cover ${className}`}
    />
  );
}

export default function AdminLocations() {
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [importingLocationId, setImportingLocationId] = useState(null);
  const [deletingLocationId, setDeletingLocationId] = useState(null);
  const [panelLocations, setPanelLocations] = useState([]);
  const [importedLocations, setImportedLocations] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState("");
  const [viewDetailsLocation, setViewDetailsLocation] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError("");

    fetchPanelLocations()
      .then((res) => { if (!cancelled) setPanelLocations(res?.locations || []); })
      .catch((err) => { if (!cancelled) { setPanelLocations([]); setError(err?.message || "Failed to fetch locations from panel"); } });

    fetchImportedLocations()
      .then((res) => { if (!cancelled) { setImportedLocations(res?.locations || []); setDataLoaded(true); } })
      .catch((err) => { if (!cancelled) { setImportedLocations([]); setError(err?.message || "Failed to fetch imported locations"); setDataLoaded(true); } });

    return () => { cancelled = true; };
  }, []);

  const importedLocationIds = new Set(importedLocations.map(l => l.id));

  const handleImport = async (locationId) => {
    if (importedLocationIds.has(locationId)) return;
    setError("");
    setImportingLocationId(locationId);
    try {
      await addLocation(locationId);
      const res = await fetchImportedLocations();
      setImportedLocations(res?.locations || []);
    } catch (err) {
      setError(err?.message || "Failed to import location");
    } finally {
      setImportingLocationId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    setDeletingLocationId(deleteTarget.id);
    setDeleteModalOpen(false);
    try {
      await deleteLocation(deleteTarget.id);
      const res = await fetchImportedLocations();
      setImportedLocations(res?.locations || []);
      if (viewDetailsLocation?.id === deleteTarget.id) {
        setDetailsModalOpen(false);
        setViewDetailsLocation(null);
      }
    } catch (err) {
      setError(err?.message || "Failed to delete location");
    } finally {
      setDeletingLocationId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-surface px-10 py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Locations</h1>
          <p className="text-[13px] font-bold text-muted-foreground mt-2">Manage deployment regions and linked nodes</p>
        </div>
        <button
          onClick={() => setSetupModalOpen(true)}
          className="h-8 px-4 flex items-center gap-2 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
        >
          <Plus size={12} />
          Import Locations
        </button>
      </div>

      {error && (
        <div className="mb-6 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
          <p className="text-[11px] font-bold text-red-500">{error}</p>
        </div>
      )}

      {/* Locations count */}
      {dataLoaded && importedLocations.length > 0 && (
        <div className="flex items-center px-1 mb-4">
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{importedLocations.length} region{importedLocations.length !== 1 ? "s" : ""} configured</span>
        </div>
      )}

      {!dataLoaded ? (
        <div className="border border-surface-lighter rounded-lg">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`px-6 py-5 animate-pulse ${i > 0 ? 'border-t border-surface-lighter' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-5 h-4 bg-surface-lighter rounded-sm" />
                <div className="h-3 w-24 bg-surface-lighter rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : importedLocations.length === 0 ? (
        <div className="border border-surface-lighter rounded-lg py-20 px-6">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-surface-light border border-surface-lighter flex items-center justify-center mb-5">
              <MapPin size={18} className="text-muted-foreground/30" />
            </div>
            <p className="text-[15px] font-bold text-foreground tracking-tight mb-1.5">No locations yet</p>
            <p className="text-[11px] font-bold text-muted-foreground/50 text-center max-w-[260px] leading-relaxed mb-7">
              Import deployment regions from your panel to start assigning servers.
            </p>
            <button
              onClick={() => setSetupModalOpen(true)}
              className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer"
            >
              Import Locations
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-surface-lighter rounded-lg">
          <div className="grid grid-cols-[2fr_2fr_1fr_auto] px-6 py-3 border-b border-surface-lighter">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Region</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Description</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nodes</span>
            <span className="w-8" />
          </div>

          {importedLocations.map((location, idx) => (
            <div
              key={location.id}
              className={`group grid grid-cols-[2fr_2fr_1fr_auto] px-6 py-4 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <CountryFlag code={location.shortCode} size={20} className="opacity-80" />
                <span className="text-[13px] font-bold text-foreground tracking-tight">{location.shortCode}</span>
              </div>
              <div className="flex items-center min-w-0">
                <span className="text-[11px] font-bold text-muted-foreground truncate">{location.description || "No description"}</span>
              </div>
              <div className="flex items-center">
                <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{location.nodes?.length || 0}</span>
              </div>
              <div className="flex items-center justify-end">
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === location.id ? null : location.id); }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer"
                  >
                    <Ellipsis size={14} />
                  </button>

                  {openMenuId === location.id && (
                    <div
                      className="absolute right-0 mt-1 w-36 rounded-lg border border-surface-lighter shadow-xl z-50 overflow-hidden"
                      style={{ backgroundColor: 'var(--surface)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="p-1">
                        <button
                          onClick={() => { setOpenMenuId(null); setViewDetailsLocation(location); setDetailsModalOpen(true); }}
                          className="w-full px-3 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all rounded-md"
                        >
                          View Nodes
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setDeleteTarget(location); setDeleteModalOpen(true); }}
                          disabled={deletingLocationId === location.id}
                          className="w-full px-3 py-2 text-left text-[11px] font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-md disabled:opacity-30"
                        >
                          {deletingLocationId === location.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      <CenterModal isOpen={setupModalOpen} onClose={() => setSetupModalOpen(false)} maxWidth="max-w-xl">
        <div className="p-6">
          <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Import Locations</h2>
          <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-5">Select regions from your panel to make available for deployment.</p>

          {panelLocations.length === 0 ? (
            <div className="border border-surface-lighter rounded-lg py-10 flex items-center justify-center">
              <span className="text-[12px] font-bold text-muted-foreground/40">No locations found in panel</span>
            </div>
          ) : (
            <div className="border border-surface-lighter rounded-lg max-h-[320px] overflow-y-auto custom-scrollbar">
              {panelLocations.map((location, idx) => {
                const isImported = importedLocationIds.has(location.id);
                const isImporting = importingLocationId === location.id;

                return (
                  <div
                    key={location.id}
                    className={`flex items-center justify-between px-5 py-3.5 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CountryFlag code={location.shortCode} size={18} className="opacity-80" />
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-foreground tracking-tight truncate">{location.description || "Untitled"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground/40">{location.shortCode}</span>
                          <span className="text-muted-foreground/10">·</span>
                          <span className="text-[10px] font-bold text-muted-foreground/40 tabular-nums">{location.nodes?.length || 0} nodes</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 ml-4">
                      {isImported ? (
                        <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Imported</span>
                      ) : (
                        <button
                          onClick={() => handleImport(location.id)}
                          disabled={isImporting}
                          className="h-7 px-3 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                        >
                          {isImporting ? (
                            <>
                              <div className="w-2.5 h-2.5 border-[1.5px] border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                              Importing
                            </>
                          ) : (
                            "Import"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end mt-5">
            <button
              onClick={() => setSetupModalOpen(false)}
              className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </CenterModal>

      {/* Nodes Detail Modal */}
      <CenterModal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="max-w-xl">
        {viewDetailsLocation && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-1">
              <CountryFlag code={viewDetailsLocation.shortCode} size={18} className="opacity-80" />
              <h2 className="text-[16px] font-bold text-foreground tracking-tight">{viewDetailsLocation.shortCode}</h2>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-5">
              {viewDetailsLocation.description || "Node infrastructure details"}
            </p>

            {viewDetailsLocation.nodes && viewDetailsLocation.nodes.length > 0 ? (
              <div className="border border-surface-lighter rounded-lg max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-[1fr_2fr] px-5 py-2.5 border-b border-surface-lighter">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Node</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">FQDN</span>
                </div>
                {viewDetailsLocation.nodes.map((node, idx) => (
                  <div key={node.id} className={`grid grid-cols-[1fr_2fr] px-5 py-3 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}>
                    <span className="text-[12px] font-bold text-foreground tracking-tight">{node.name}</span>
                    <span className="text-[11px] font-bold text-muted-foreground font-mono truncate">{node.fqdn}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-surface-lighter rounded-lg py-10 flex items-center justify-center">
                <span className="text-[12px] font-bold text-muted-foreground/40">No nodes linked</span>
              </div>
            )}

            <div className="flex items-center justify-end mt-5">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </CenterModal>

      {/* Delete Modal */}
      <CenterModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="max-w-md">
        <div className="p-6">
          <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Remove Location</h2>
          <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-6">
            Remove <span className="text-foreground">"{deleteTarget?.shortCode}"</span> and unlink all associated nodes?
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="h-8 px-5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}
