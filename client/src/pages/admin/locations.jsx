import { MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CenterModal from "../../components/modals/center-modal";
import { Button } from "@/components/ui/button";

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
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.error || data?.message || "request_failed";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
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
    return <MapPin size={size} className={className || 'text-white/40'} />;
  }

  const url = `https://flagsapi.com/${country}/flat/64.png`;

  return (
    <img
      src={url}
      alt={country}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-sm ${className}`}
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

  useEffect(() => {
    let cancelled = false;

    setError("");

    fetchPanelLocations()
      .then((res) => {
        if (cancelled) return;
        setPanelLocations(res?.locations || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setPanelLocations([]);
        setError(err?.message || "Failed to fetch locations from panel");
      });

    fetchImportedLocations()
      .then((res) => {
        if (cancelled) return;
        setImportedLocations(res?.locations || []);
        setDataLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setImportedLocations([]);
        setError(err?.message || "Failed to fetch imported locations");
        setDataLoaded(true);
      });

    return () => {
      cancelled = true;
    };
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

  const handleDelete = async (locationId) => {
    setError("");
    setDeletingLocationId(locationId);

    try {
      await deleteLocation(locationId);
      const res = await fetchImportedLocations();
      setImportedLocations(res?.locations || []);
      if (viewDetailsLocation?.id === locationId) {
        setDetailsModalOpen(false);
        setViewDetailsLocation(null);
      }
    } catch (err) {
      setError(err?.message || "Failed to delete location");
    } finally {
      setDeletingLocationId(null);
    }
  };

  const handleViewDetails = (location) => {
    setViewDetailsLocation(location);
    setDetailsModalOpen(true);
  };

  return (
    <div className="bg-surface px-16 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-brand tracking-tight">Locations</h1>
        </div>
        <Button 
          onClick={() => setSetupModalOpen(true)}
          className="h-8 px-3 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-none"
        >
          <Plus size={12} />
          Setup Locations
        </Button>
      </div>

      {error && (
        <div className="mb-8 px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10 text-[11px] font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
        <div className="w-full">
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr] px-6 py-3">
            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Short Code</span>
            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Description</span>
            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Nodes</span>
            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-right">Actions</span>
          </div>
          <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[210px]">
            {!dataLoaded ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 border-b border-surface-lighter animate-pulse bg-brand/[0.01]" />
              ))
            ) : importedLocations.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center flex-1">
                <span className="text-[12px] font-bold text-brand/40 italic">No locations configured yet</span>
              </div>
            ) : (
              importedLocations.map((location) => (
                <div
                  key={location.id}
                  className="grid grid-cols-[1fr_2fr_1fr_1fr] px-6 py-4 hover:bg-surface-light/50 transition-colors border-b border-surface-lighter"
                >
                  <div className="flex items-center gap-3">
                    <CountryFlag code={location.shortCode} size={20} className="brightness-110" />
                    <span className="text-[12px] font-bold text-brand uppercase tracking-tight">{location.shortCode}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[11px] font-bold text-brand/60">{location.description || "Geographic region details"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">{location.nodes?.length || 0} Nodes Linked</span>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleViewDetails(location)}
                      className="text-[10px] font-bold text-brand/30 hover:text-brand uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      View Nodes
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      disabled={deletingLocationId === location.id}
                      className="text-[10px] font-bold text-red-500/40 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-30"
                    >
                      {deletingLocationId === location.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CenterModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        <div className="p-4">
          <div className="mb-4">
            <h2 className="text-[15px] font-bold text-brand">Setup Locations</h2>
            <p className="text-[10px] font-bold text-brand/40 mt-0.5 uppercase tracking-widest">Select regions to import from your panel</p>
          </div>

          <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
            <div className="w-full">
              <div className="grid grid-cols-[1.5fr_1fr_1fr] px-5 py-2">
                <span className="text-[9px] font-bold text-brand/50 uppercase tracking-[0.2em]">Region Details</span>
                <span className="text-[9px] font-bold text-brand/50 uppercase tracking-[0.2em]">Statistics</span>
                <span className="text-[9px] font-bold text-brand/50 uppercase tracking-[0.2em] text-right">Actions</span>
              </div>
              <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col max-h-[260px] overflow-y-auto custom-scrollbar divide-y divide-surface-lighter">
                {panelLocations.length === 0 ? (
                  <div className="py-10 text-center">
                    <span className="text-[11px] font-bold text-brand/40 italic">No available locations found</span>
                  </div>
                ) : (
                  panelLocations.map((location) => (
                    <div
                      key={location.id}
                      className="grid grid-cols-[1.5fr_1fr_1fr] items-center px-5 py-3 hover:bg-surface-light/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <CountryFlag code={location.shortCode} size={18} />
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-brand uppercase tracking-tight truncate max-w-[140px]">{location.description || 'Untitled'}</span>
                          <span className="text-[9px] font-bold text-brand/20 uppercase tracking-widest">{location.shortCode}</span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <span className="text-[11px] font-bold text-brand/30 uppercase tracking-widest">{location.nodes?.length || 0} Nodes</span>
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          onClick={() => handleImport(location.id)}
                          disabled={importingLocationId === location.id || importedLocationIds.has(location.id)}
                          className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-none"
                        >
                          {importingLocationId === location.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin mr-2" />
                              Importing...
                            </>
                          ) : importedLocationIds.has(location.id) ? (
                            "Imported"
                          ) : (
                            "Import"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end mt-3">
            <button
              onClick={() => setSetupModalOpen(false)}
              className="px-3 py-1.5 text-[10px] font-bold text-brand/40 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
            >
              Close View
            </button>
          </div>
        </div>
      </CenterModal>

      <CenterModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        {viewDetailsLocation && (
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold text-brand">{viewDetailsLocation.shortCode} · Nodes</h2>
              <p className="text-[10px] font-bold text-brand/40 mt-0.5 uppercase tracking-widest">{viewDetailsLocation.description || "Infrastructure network details"}</p>
            </div>

            <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
              <div className="w-full">
                <div className="grid grid-cols-[1.2fr_2fr] px-5 py-2">
                  <span className="text-[9px] font-bold text-brand/50 uppercase tracking-[0.2em]">Node Name</span>
                  <span className="text-[9px] font-bold text-brand/50 uppercase tracking-[0.2em]">FQDN / Address</span>
                </div>
                <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col max-h-[260px] overflow-y-auto custom-scrollbar divide-y divide-surface-lighter">
                  {viewDetailsLocation.nodes && viewDetailsLocation.nodes.length > 0 ? (
                    viewDetailsLocation.nodes.map((node) => (
                      <div key={node.id} className="grid grid-cols-[1.2fr_2fr] px-5 py-2.5 hover:bg-surface-light/30 transition-colors">
                        <span className="text-[11px] font-bold text-brand uppercase tracking-tight">{node.name}</span>
                        <span className="text-[10px] font-bold text-brand/20 font-mono truncate">{node.fqdn}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <span className="text-[11px] font-bold text-brand/40 italic">No nodes found for this location</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end mt-3">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-3 py-1.5 text-[10px] font-bold text-brand/40 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
}



