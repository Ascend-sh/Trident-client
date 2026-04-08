import { Plus, Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
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

function fetchPanelNests({ page = 1, perPage = 50 } = {}) {
  const qs = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return request(`/admin/panel-nests?${qs}`);
}

function fetchImportedNests() {
  return request('/admin/imported-nests');
}

function addNest(nestId) {
  return request('/admin/add-nest', { method: 'POST', body: { id: nestId } });
}

function deleteNest(nestId) {
  const qs = new URLSearchParams({ id: String(nestId) });
  return request(`/admin/delete-nest?${qs}`, { method: 'DELETE' });
}

export default function AdminSoftware() {
  const [activeTab, setActiveTab] = useState("active");
  const [eggsModalOpen, setEggsModalOpen] = useState(false);
  const [selectedNest, setSelectedNest] = useState(null);
  const [addingNestId, setAddingNestId] = useState(null);
  const [availableNests, setAvailableNests] = useState([]);
  const [activeNests, setActiveNests] = useState([]);
  const [error, setError] = useState("");
  const [deletingNestId, setDeletingNestId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [nestToDelete, setNestToDelete] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError("");

    fetchPanelNests()
      .then((res) => { if (!cancelled) setAvailableNests(res?.nests || []); })
      .catch((err) => { if (!cancelled) { setAvailableNests([]); setError(err?.message || "Failed to fetch nests from panel"); } });

    fetchImportedNests()
      .then((res) => { if (!cancelled) setActiveNests(res?.nests || []); })
      .catch((err) => { if (!cancelled) { setActiveNests([]); setError(err?.message || "Failed to fetch imported nests"); } });

    return () => { cancelled = true; };
  }, []);

  const importedNestIds = new Set(activeNests.map(n => n.id));

  const handleAddNest = async (nestId) => {
    if (importedNestIds.has(nestId)) return;
    setError("");
    setAddingNestId(nestId);
    try {
      await addNest(nestId);
      const res = await fetchImportedNests();
      setActiveNests(res?.nests || []);
    } catch (err) {
      setError(err?.message || "Failed to import nest");
    } finally {
      setAddingNestId(null);
    }
  };

  const handleDeleteNest = async () => {
    if (!nestToDelete) return;
    setError("");
    setDeletingNestId(nestToDelete.id);
    setDeleteModalOpen(false);
    try {
      await deleteNest(nestToDelete.id);
      const res = await fetchImportedNests();
      setActiveNests(res?.nests || []);
      if (selectedNest?.id === nestToDelete.id) {
        setEggsModalOpen(false);
        setSelectedNest(null);
      }
    } catch (err) {
      setError(err?.message || "Failed to delete nest");
    } finally {
      setDeletingNestId(null);
      setNestToDelete(null);
    }
  };

  return (
    <div className="bg-surface px-10 py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Software</h1>
          <p className="text-[13px] font-bold text-muted-foreground mt-2">Manage nests and server software from your panel</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {[
          { label: "Active", value: "active", count: activeNests.length },
          { label: "Available", value: "available", count: availableNests.length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.value
                ? 'bg-foreground text-surface'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className={`tabular-nums ${activeTab === tab.value ? 'text-surface/50' : 'text-muted-foreground/40'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
          <p className="text-[11px] font-bold text-red-500">{error}</p>
        </div>
      )}

      {/* Active Nests */}
      {activeTab === "active" && (
        activeNests.length === 0 ? (
          <div className="border border-surface-lighter rounded-lg py-20 px-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-6">
                <div className="w-3 h-3 rounded bg-surface-lighter" />
                <div className="w-3 h-3 rounded bg-surface-lighter" />
                <div className="w-3 h-3 rounded bg-surface-lighter" />
              </div>
              <p className="text-[15px] font-bold text-foreground tracking-tight mb-1.5">No nests imported</p>
              <p className="text-[11px] font-bold text-muted-foreground/50 text-center max-w-[260px] leading-relaxed mb-7">
                Import nests from your panel to make server software available to users.
              </p>
              <button
                onClick={() => setActiveTab("available")}
                className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer"
              >
                Browse Available
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-surface-lighter rounded-lg">
            <div className="grid grid-cols-[2fr_2fr_1fr_auto] px-6 py-3 border-b border-surface-lighter">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nest</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Description</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Eggs</span>
              <span className="w-8" />
            </div>

            {activeNests.map((nest, idx) => (
              <div
                key={nest.id}
                className={`group grid grid-cols-[2fr_2fr_1fr_auto] px-6 py-4 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
              >
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[13px] font-bold text-foreground tracking-tight truncate">{nest.name}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/40 mt-0.5">ID {nest.id}</span>
                </div>
                <div className="flex items-center min-w-0">
                  <span className="text-[11px] font-bold text-muted-foreground truncate">{nest.description || "No description"}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{nest.eggCount || 0}</span>
                </div>
                <div className="flex items-center justify-end">
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === nest.id ? null : nest.id); }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer"
                    >
                      <Ellipsis size={14} />
                    </button>

                    {openMenuId === nest.id && (
                      <div
                        className="absolute right-0 mt-1 w-36 rounded-lg border border-surface-lighter shadow-xl z-50 overflow-hidden"
                        style={{ backgroundColor: 'var(--surface)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="p-1">
                          <button
                            onClick={() => { setOpenMenuId(null); setSelectedNest(nest); setEggsModalOpen(true); }}
                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all rounded-md"
                          >
                            View Eggs
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); setNestToDelete(nest); setDeleteModalOpen(true); }}
                            disabled={deletingNestId === nest.id}
                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-md disabled:opacity-30"
                          >
                            {deletingNestId === nest.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Available Nests */}
      {activeTab === "available" && (
        availableNests.length === 0 ? (
          <div className="border border-surface-lighter rounded-lg py-16 px-6">
            <div className="flex flex-col items-center">
              <p className="text-[13px] font-bold text-muted-foreground/50">No nests found in panel</p>
            </div>
          </div>
        ) : (
          <div className="border border-surface-lighter rounded-lg">
            <div className="grid grid-cols-[2fr_2fr_1fr_auto] px-6 py-3 border-b border-surface-lighter">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nest</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Description</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Author</span>
              <span className="w-20" />
            </div>

            {availableNests.map((nest, idx) => {
              const isImported = importedNestIds.has(nest.id);
              const isAdding = addingNestId === nest.id;

              return (
                <div
                  key={nest.id}
                  className={`group grid grid-cols-[2fr_2fr_1fr_auto] px-6 py-4 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
                >
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-[13px] font-bold text-foreground tracking-tight truncate">{nest.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/40 mt-0.5">ID {nest.id}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="text-[11px] font-bold text-muted-foreground truncate">{nest.description || "No description"}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="text-[11px] font-bold text-muted-foreground truncate">support@pterodactyl.io</span>
                  </div>
                  <div className="flex items-center justify-end">
                    {isImported ? (
                      <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Imported</span>
                    ) : (
                      <button
                        onClick={() => handleAddNest(nest.id)}
                        disabled={isAdding}
                        className="h-8 px-4 flex items-center gap-1.5 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                      >
                        {isAdding ? (
                          <>
                            <div className="w-3 h-3 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                            Importing
                          </>
                        ) : (
                          <>
                            <Plus size={12} />
                            Import
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Eggs Modal */}
      <CenterModal isOpen={eggsModalOpen} onClose={() => setEggsModalOpen(false)} maxWidth="max-w-2xl">
        {selectedNest && (
          <div className="p-6">
            <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">{selectedNest.name}</h2>
            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-5">
              {selectedNest.description || "Software repository details"}
            </p>

            {selectedNest.eggs && selectedNest.eggs.length > 0 ? (
              <div className="border border-surface-lighter rounded-lg max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-[1.5fr_1fr_2fr] px-5 py-2.5 border-b border-surface-lighter">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Egg</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Author</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Docker Image</span>
                </div>
                {selectedNest.eggs.map((egg, idx) => (
                  <div key={egg.id} className={`grid grid-cols-[1.5fr_1fr_2fr] px-5 py-3 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}>
                    <span className="text-[12px] font-bold text-foreground tracking-tight truncate">{egg.name}</span>
                    <span className="text-[11px] font-bold text-muted-foreground truncate">{egg.author}</span>
                    <span className="text-[10px] font-bold text-muted-foreground font-mono truncate">{egg.dockerImage}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-surface-lighter rounded-lg py-10 flex items-center justify-center">
                <span className="text-[12px] font-bold text-muted-foreground/40">No eggs found</span>
              </div>
            )}

            <div className="flex items-center justify-end mt-5">
              <button
                onClick={() => setEggsModalOpen(false)}
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
          <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Remove Nest</h2>
          <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-6">
            Remove <span className="text-foreground">"{nestToDelete?.name}"</span> and all its eggs from your system?
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteNest}
              className="h-8 px-5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer flex items-center gap-2"
            >
              Remove
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}
