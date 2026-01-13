import { Package, Plus, Server, Code } from "lucide-react";
import { useEffect, useState } from "react";
import CenterModal from "../../components/modals/center-modal";
import { addNest, deleteNest, fetchImportedNests, fetchPanelNests } from "../../utils/admin-nests";

export default function AdminSoftware() {
  const [activeTab, setActiveTab] = useState("available");
  const [eggsModalOpen, setEggsModalOpen] = useState(false);
  const [selectedNest, setSelectedNest] = useState(null);
  const [addingNestId, setAddingNestId] = useState(null);
  const [availableNests, setAvailableNests] = useState([]);
  const [activeNests, setActiveNests] = useState([]);
  const [error, setError] = useState("");
  const [deletingNestId, setDeletingNestId] = useState(null);

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

  const handleDeleteNest = async (nestId) => {
    setError("");
    setDeletingNestId(nestId);

    try {
      await deleteNest(nestId);
      const res = await fetchImportedNests();
      setActiveNests(res?.nests || []);
      if (selectedNest?.id === nestId) {
        setEggsModalOpen(false);
        setSelectedNest(null);
      }
    } catch (err) {
      setError(err?.message || "Failed to delete nest");
    } finally {
      setDeletingNestId(null);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#091416" }}>
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
              ? "text-white border-[#ADE5DA]"
              : "text-white/60 border-transparent hover:text-white/80"
          }`}
        >
          Available Nests
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-xs font-medium transition-colors duration-200 border-b-2 ${
            activeTab === "active"
              ? "text-white border-[#ADE5DA]"
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
                    style={{ backgroundColor: "#ADE5DA", color: "#091416" }}
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
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Server size={32} className="text-white/40" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">No Active Nests</h3>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                You haven't added any nests yet. Go to "Available Nests" to import nests from your Pterodactyl panel.
              </p>
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
                      <div className="w-10 h-10 rounded-lg bg-[#ADE5DA]/20 flex items-center justify-center">
                        <Package size={20} style={{ color: "#ADE5DA" }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{nest.name}</h3>
                        <p className="text-xs text-white/40">{nest.eggCount} eggs</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white/60 mb-4">{nest.description || "No description"}</p>

                  <div className="flex items-center justify-end gap-2 mt-auto pt-2">
                    <button
                      onClick={() => handleDeleteNest(nest.id)}
                      disabled={deletingNestId === nest.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 border border-red-500/20 text-red-200 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingNestId === nest.id ? "Deleting..." : "Delete"}
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
        title={selectedNest ? `${selectedNest.name} - Eggs` : "Eggs"}
        maxWidth="max-w-3xl"
      >
        {selectedNest && (
          <div className="space-y-4">
            <p className="text-xs text-white/60">{selectedNest.description}</p>
            
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10" style={{ backgroundColor: "#0A1618" }}>
                    <th className="text-left px-4 py-3 text-white/80 font-medium">Egg Name</th>
                    <th className="text-left px-4 py-3 text-white/80 font-medium">Author</th>
                    <th className="text-left px-4 py-3 text-white/80 font-medium">Docker Image</th>
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

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-white/40">{selectedNest.eggs?.length || 0} eggs total</span>
              <button
                onClick={() => setEggsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200"
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
