import { Package, Plus, Server, Code, Trash2, Search } from "lucide-react";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    setError("");

    fetchPanelNests()
      .then((res) => {
        if (cancelled) return;
        setAvailableNests(res?.nests || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailableNests([]);
        setError(err?.message || "Failed to fetch nests from panel");
      });

    fetchImportedNests()
      .then((res) => {
        if (cancelled) return;
        setActiveNests(res?.nests || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setActiveNests([]);
        setError(err?.message || "Failed to fetch imported nests");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewEggs = (nest) => {
    setSelectedNest(nest);
    setEggsModalOpen(true);
  };

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

  const confirmDeleteNest = (nest) => {
    setNestToDelete(nest);
    setDeleteModalOpen(true);
  };

  return (
    <div className="bg-surface px-16 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-brand tracking-tight">Software Management</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "active" 
              ? 'bg-surface-highlight border border-surface-lighter text-brand' 
              : 'text-brand/30 hover:text-brand/60 hover:bg-surface-lighter'
          }`}
        >
          Active Nests
        </button>
        <button
          onClick={() => setActiveTab("available")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "available" 
              ? 'bg-surface-highlight border border-surface-lighter text-brand' 
              : 'text-brand/30 hover:text-brand/60 hover:bg-surface-lighter'
          }`}
        >
          Available Nests
        </button>
      </div>

      {error && (
        <div className="mb-8 px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10 text-[11px] font-bold text-red-600">
          {error}
        </div>
      )}

      {activeTab === "available" && (
        <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
          <div className="w-full">
            <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr] px-6 py-3">
              <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Nest Name</span>
              <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Description</span>
              <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Author</span>
              <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-right">Actions</span>
            </div>
            <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[210px]">
              {availableNests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center flex-1">
                  <span className="text-[12px] font-bold text-brand/40 italic">No nests found in panel</span>
                </div>
              ) : (
                availableNests.map((nest) => (
                  <div
                    key={nest.id}
                    className="grid grid-cols-[1.5fr_2fr_1fr_1fr] px-6 py-4 hover:bg-surface-light/50 transition-colors border-b border-surface-lighter"
                  >
                    <div className="flex flex-col justify-center">
                      <span className="text-[12px] font-bold text-brand uppercase tracking-tight">{nest.name}</span>
                      <span className="text-[9px] font-bold text-brand/20 uppercase tracking-tighter">ID: {nest.id}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[11px] font-bold text-brand/60 line-clamp-1">{nest.description || "No description provided"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[11px] font-bold text-brand/30 uppercase tracking-widest truncate">support@pterodactyl.io</span>
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        onClick={() => handleAddNest(nest.id)}
                        disabled={addingNestId === nest.id || importedNestIds.has(nest.id)}
                        className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-none"
                      >
                        {addingNestId === nest.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin mr-2" />
                            Adding...
                          </>
                        ) : importedNestIds.has(nest.id) ? (
                          "Imported"
                        ) : (
                          <>
                            <Plus size={12} className="mr-1.5" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "active" && (
        <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
          <div className="w-full">
            <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr] px-6 py-3">
              <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Nest Name</span>
              <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Description</span>
              <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Statistics</span>
              <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-right">Actions</span>
            </div>
            <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[210px]">
              {activeNests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center flex-1">
                  <Package size={32} className="text-brand/10 mb-4" />
                  <span className="text-[12px] font-bold text-brand/40 italic mb-4">No active nests imported yet</span>
                  <Button
                    onClick={() => setActiveTab("available")}
                    variant="outline"
                    className="h-8 px-4 border-surface-lighter text-brand/60 hover:bg-surface-light transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none"
                  >
                    <Search size={12} className="mr-1.5" />
                    Browse Available
                  </Button>
                </div>
              ) : (
                activeNests.map((nest) => (
                  <div
                    key={nest.id}
                    className="grid grid-cols-[1.5fr_2fr_1fr_1fr] px-6 py-4 hover:bg-surface-light/50 transition-colors border-b border-surface-lighter"
                  >
                    <div className="flex flex-col justify-center">
                      <span className="text-[12px] font-bold text-brand uppercase tracking-tight">{nest.name}</span>
                      <span className="text-[9px] font-bold text-brand/20 uppercase tracking-tighter">ID: {nest.id}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[11px] font-bold text-brand/60 line-clamp-1">{nest.description || "No description provided"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">{nest.eggCount || 0} Eggs Loaded</span>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleViewEggs(nest)}
                        className="text-[10px] font-bold text-brand/30 hover:text-brand uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        View Eggs
                      </button>
                      <button
                        onClick={() => confirmDeleteNest(nest)}
                        disabled={deletingNestId === nest.id}
                        className="text-[10px] font-bold text-red-500/40 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-30"
                      >
                        {deletingNestId === nest.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <CenterModal
        isOpen={eggsModalOpen}
        onClose={() => setEggsModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        {selectedNest && (
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold text-brand">{selectedNest.name} · Eggs</h2>
              <p className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mt-0.5 truncate max-w-[400px]">
                {selectedNest.description ? selectedNest.description.replace(/Minecraft - the classic game from Mojang\. With support for Vanilla MC, Spigot, and many others!/i, "Classic game from Mojang with Vanilla, Spigot support.") : "Software repository details"}
              </p>
            </div>

            <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
              <div className="w-full">
                <div className="grid grid-cols-[1.5fr_1fr_2fr] px-5 py-2">
                  <span className="text-[9px] font-bold text-brand/50 uppercase tracking-[0.2em]">Egg Name</span>
                  <span className="text-[9px] font-bold text-brand/50 uppercase tracking-[0.2em]">Author</span>
                  <span className="text-[9px] font-bold text-brand/50 uppercase tracking-[0.2em]">Docker Image</span>
                </div>
                <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col max-h-[260px] overflow-y-auto custom-scrollbar divide-y divide-surface-lighter">
                  {selectedNest.eggs && selectedNest.eggs.length > 0 ? (
                    selectedNest.eggs.map((egg) => (
                      <div key={egg.id} className="grid grid-cols-[1.5fr_1fr_2fr] px-5 py-2.5 hover:bg-surface-light/30 transition-colors">
                        <span className="text-[11px] font-bold text-brand uppercase tracking-tight">{egg.name}</span>
                        <span className="text-[10px] font-bold text-brand/40 uppercase tracking-widest truncate">{egg.author}</span>
                        <span className="text-[10px] font-bold text-brand/20 font-mono truncate">{egg.dockerImage}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <span className="text-[11px] font-bold text-brand/40 italic">No eggs found for this nest</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end mt-3">
              <button
                onClick={() => setEggsModalOpen(false)}
                className="px-3 py-1.5 text-[10px] font-bold text-brand/40 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </CenterModal>

      <CenterModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="p-4">
          <h2 className="text-[16px] font-bold text-brand mb-4 tracking-tight">Delete Nest</h2>
          <p className="text-[12px] font-bold text-brand/60 mb-6">
            Are you sure you want to remove <span className="text-brand">"{nestToDelete?.name}"</span>? This will remove the nest and all associated software eggs from your system.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-lighter">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-[10px] font-bold text-brand/40 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancel
            </button>
            <Button
              onClick={handleDeleteNest}
              className="h-9 px-6 bg-red-500 text-white hover:bg-red-600 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest shadow-none cursor-pointer"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}



