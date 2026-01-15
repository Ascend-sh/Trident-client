import { MapPin, Plus, Trash2, Layers2 } from "lucide-react";
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
      })
      .catch((err) => {
        if (cancelled) return;
        setImportedLocations([]);
        setError(err?.message || "Failed to fetch imported locations");
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
    <div className="min-h-screen p-6" style={{ backgroundColor: "#18181b" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Locations</h1>
          <p className="text-xs text-white/60">Manage server locations</p>
        </div>
        <button 
          onClick={() => setSetupModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90" 
          style={{ backgroundColor: "#14b8a6" }}
        >
          <Plus size={14} />
          Setup Locations
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {importedLocations.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-12 text-center">
          <MapPin size={32} className="text-white/30 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-white/50 mb-2">No Locations Configured</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            Set up server locations to organize and distribute your servers geographically
          </p>
        </div>
      ) : (
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10" style={{ backgroundColor: "#18181b" }}>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Short Code</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Description</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Nodes</th>
                <th className="text-right px-4 py-3 text-white/60 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {importedLocations.map((location) => (
                <tr
                  key={location.id}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CountryFlag code={location.shortCode} size={16} />
                      <span className="text-sm text-white">{location.shortCode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60">{location.description}</td>
                  <td className="px-4 py-3 text-white/40">{location.nodes?.length || 0} nodes</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(location)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 border border-white/10 text-white/60 hover:bg-white/5 hover:text-white flex items-center gap-1.5"
                      >
                        <Layers2 size={14} />
                        View Nodes
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        disabled={deletingLocationId === location.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {deletingLocationId === location.id ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CenterModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-white mb-4">Available Locations</h2>
          <p className="text-xs text-white/60 mb-6">
            These locations are available from your Pterodactyl panel. Select locations to import into your dashboard.
          </p>

          <div className="border border-white/10 rounded-lg overflow-hidden">
            {panelLocations.map((location, index) => (
              <div
                key={location.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors duration-200 ${
                  index !== panelLocations.length - 1 ? 'border-b border-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <CountryFlag code={location.shortCode} size={16} />
                  <div>
                    <span className="text-sm text-white">{location.description || 'Untitled'}</span>
                    <span className="text-xs text-white/40 ml-2">{location.shortCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">{location.nodes?.length || 0} nodes</span>
                  <button
                    onClick={() => handleImport(location.id)}
                    disabled={importingLocationId === location.id || importedLocationIds.has(location.id)}
                    className="px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
                  >
                    {importingLocationId === location.id ? (
                      <>
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Importing...
                      </>
                    ) : importedLocationIds.has(location.id) ? (
                      'Imported'
                    ) : (
                      'Import'
                    )}
                  </button>
                </div>
              </div>
            ))}

            {panelLocations.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-xs text-white/50">No locations found</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/10">
            <span className="text-xs text-white/40">{panelLocations.length} locations available</span>
            <button
              onClick={() => setSetupModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </CenterModal>

      <CenterModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="max-w-3xl"
      >
        {viewDetailsLocation && (
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold text-white mb-1">
              {viewDetailsLocation ? `${viewDetailsLocation.shortCode} - Nodes` : "Location Nodes"}
            </h2>
            <p className="text-xs text-white/60 mb-6">{viewDetailsLocation.description}</p>

            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10" style={{ backgroundColor: "#18181b" }}>
                    <th className="text-left px-4 py-2 text-white/80 font-medium">Node Name</th>
                    <th className="text-left px-4 py-2 text-white/80 font-medium">FQDN</th>
                  </tr>
                </thead>
                <tbody>
                  {viewDetailsLocation.nodes && viewDetailsLocation.nodes.length > 0 ? (
                    viewDetailsLocation.nodes.map((node) => (
                      <tr key={node.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200 last:border-b-0">
                        <td className="px-4 py-3 text-white">{node.name}</td>
                        <td className="px-4 py-3 text-white/60 font-mono text-[10px]">{node.fqdn}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-4 py-8 text-center text-white/50">
                        No nodes available for this location
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/10">
              <span className="text-xs text-white/40">{viewDetailsLocation.nodes?.length || 0} nodes total</span>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
}



