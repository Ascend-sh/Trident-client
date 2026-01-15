import { Package, Plus, Server, Code } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("available");
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
    <div className="min-h-screen p-6" style={{ backgroundColor: "#18181b" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Software Management</h1>
          <p className="text-white/60 text-xs">Manage nests and eggs from your Pterodactyl panel</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-2 text-xs font-medium transition-colors duration-200 border-b-2 ${
            activeTab === "available"
              ? "text-white border-[#14b8a6]"
              : "text-white/60 border-transparent hover:text-white/80"
          }`}
        >
          Available Nests
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-xs font-medium transition-colors duration-200 border-b-2 ${
            activeTab === "active"
              ? "text-white border-[#14b8a6]"
              : "text-white/60 border-transparent hover:text-white/80"
          }`}
        >
          Active Nests
        </button>
      </div>

      {activeTab === "available" && (
        <div>
          <div className="mb-4">
            <p className="text-xs text-white/50">
              These nests are available on your Pterodactyl panel. Click "Add Nest" to import them into your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableNests.map((nest) => (
              <div
                key={nest.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-colors duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Package size={20} className="text-white/60" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{nest.name}</h3>
                      <p className="text-xs text-white/40">support@pterodactyl.io</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/60 mb-4">{nest.description || "No description"}</p>

                <div className="flex items-center justify-end mt-auto pt-2">
                  <button
                    onClick={() => handleAddNest(nest.id)}
                    disabled={addingNestId === nest.id || importedNestIds.has(nest.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90 flex items-center gap-1.5 flex-shrink-0 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
                  >
                    {addingNestId === nest.id ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : importedNestIds.has(nest.id) ? (
                      <>Added</>
                    ) : (
                      <>
                        <Plus size={14} />
                        Add Nest
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "active" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-white/50">
              These nests are currently active and available for server creation in your dashboard.
            </p>
            <span className="text-xs text-white/40">{activeNests.length} active</span>
          </div>

          {activeNests.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-12 text-center">
              <Package size={32} className="text-white/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-white/50 mb-2">No Active Nests</h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto mb-5">
                Import nests from your Pterodactyl panel to get started with server creation
              </p>
              <button
                onClick={() => setActiveTab("available")}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90 flex items-center gap-2 mx-auto"
                style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
              >
                <Plus size={14} />
                Browse Available Nests
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeNests.map((nest) => (
                <div
                  key={nest.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#14b8a6]/20 flex items-center justify-center">
                        <Package size={20} style={{ color: "#14b8a6" }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{nest.name}</h3>
                        <p className="text-xs text-white/40">Available eggs: {nest.eggCount}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white/60 mb-4">{nest.description || "No description"}</p>

                  <div className="flex items-center justify-end gap-2 mt-auto pt-2">
                    <button
                      onClick={() => confirmDeleteNest(nest)}
                      disabled={deletingNestId === nest.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {deletingNestId === nest.id ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </button>
                    <button
                      onClick={() => handleViewEggs(nest)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 border border-white/10 text-white/60 hover:bg-white/5 hover:text-white flex items-center gap-1.5"
                    >
                      <Code size={14} />
                      View Eggs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CenterModal
        isOpen={eggsModalOpen}
        onClose={() => setEggsModalOpen(false)}
        maxWidth="max-w-3xl"
      >
        {selectedNest && (
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold text-white mb-1">{selectedNest ? `${selectedNest.name} - Eggs` : "Eggs"}</h2>
            <p className="text-xs text-white/60 mb-6">{selectedNest.description}</p>

            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10" style={{ backgroundColor: "#18181b" }}>
                    <th className="text-left px-4 py-2 text-white/80 font-medium">Egg Name</th>
                    <th className="text-left px-4 py-2 text-white/80 font-medium">Author</th>
                    <th className="text-left px-4 py-2 text-white/80 font-medium">Docker Image</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedNest.eggs && selectedNest.eggs.length > 0 ? (
                    selectedNest.eggs.map((egg) => (
                      <tr key={egg.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                        <td className="px-4 py-3 text-white">{egg.name}</td>
                        <td className="px-4 py-3 text-white/60">{egg.author}</td>
                        <td className="px-4 py-3 text-white/40 font-mono text-[10px]">{egg.dockerImage}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-white/50">
                        No eggs available for this nest
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/10">
              <span className="text-xs text-white/40">{selectedNest.eggs?.length || 0} eggs total</span>
              <button
                onClick={() => setEggsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200 cursor-pointer"
              >
                Close
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
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-white mb-4">Delete Nest</h2>

          <p className="text-xs text-white/60 mb-2">Are you sure you want to delete this nest?</p>
          <p className="text-sm font-semibold text-white mb-2">{nestToDelete?.name}</p>
          <p className="text-xs text-white/50 mb-6">This will remove the nest and all its eggs from your dashboard. This action cannot be undone.</p>

          <div className="flex items-center justify-end gap-2 pt-4 mt-6 border-t border-white/10">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteNest}
              className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors duration-200 bg-red-500 hover:bg-red-600 cursor-pointer"
            >
              Delete Nest
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}



