import { Folder, File, Ellipsis } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";

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

function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const rounded = v >= 10 || i === 0 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded} ${units[i]}`;
}

function formatRelativeTime(value) {
  const d = new Date(value);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return "-";

  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return "just now";

  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;

  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;

  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;

  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;

  const yr = Math.round(mo / 12);
  return `${yr} year${yr === 1 ? '' : 's'} ago`;
}

function normalizeDirectory(dir) {
  const s = String(dir || "/").trim();
  if (!s) return "/";
  return s.startsWith("/") ? s : `/${s}`;
}

const UI_ROOT = '/home/container';

function normalizeUiDirectory(uiDir) {
  const s = normalizeDirectory(uiDir);
  if (s === '/' || s === UI_ROOT || s.startsWith(`${UI_ROOT}/`)) return s === '/' ? UI_ROOT : s;
  return UI_ROOT;
}

function uiToApiDirectory(uiDir) {
  const ui = normalizeUiDirectory(uiDir);
  if (ui === UI_ROOT) return '/';
  const rest = ui.slice(UI_ROOT.length);
  return normalizeDirectory(rest);
}

function apiToUiDirectory(apiDir) {
  const api = normalizeDirectory(apiDir);
  if (api === '/') return UI_ROOT;
  return `${UI_ROOT}${api}`;
}

function joinPath(dir, name) {
  const base = normalizeDirectory(dir);
  if (base === "/") return `/${name}`;
  return `${base.replace(/\/$/, "")}/${name}`;
}

function splitBreadcrumb({ base = ['home','container'], dir }) {
  const s = normalizeDirectory(dir).replace(/\/$/, "");
  const parts = s.split("/").filter(Boolean);

  const crumbs = [];
  let currentApi = '';

  for (let i = 0; i < base.length; i++) {
    const label = base[i];
    crumbs.push({ label, path: '/' });
  }

  for (const p of parts) {
    currentApi += `/${p}`;
    crumbs.push({ label: p, path: currentApi });
  }

  return crumbs;
}

export default function ServerFiles() {
  const { id } = useParams();
  const serverId = Number(id);

  const [directory, setDirectory] = useState(UI_ROOT);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const menuAnchorRefs = useRef({});
  const [menuPos, setMenuPos] = useState(null);

  const breadcrumb = useMemo(() => {
    const uiDir = normalizeUiDirectory(directory);
    const apiDir = uiToApiDirectory(uiDir);
    return splitBreadcrumb({ dir: apiDir });
  }, [directory]);

  useEffect(() => {
    const onDocClick = () => {
      setOpenMenuIndex(null);
      setMenuPos(null);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenMenuIndex(null);
        setMenuPos(null);
      }
    };

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const fetchListing = async () => {
    if (!Number.isInteger(serverId) || serverId <= 0) return;

    setLoading(true);
    setError("");
    const apiDir = uiToApiDirectory(directory);

    try {
      const res = await request(`/servers/${serverId}/files/list?directory=${encodeURIComponent(apiDir)}`);
      const files = Array.isArray(res?.files) ? res.files : [];
      const sorted = files
        .slice()
        .sort((a, b) => {
          const aFolder = a?.is_file ? 0 : 1;
          const bFolder = b?.is_file ? 0 : 1;
          if (aFolder !== bFolder) return bFolder - aFolder;
          const an = String(a?.name || '').toLowerCase();
          const bn = String(b?.name || '').toLowerCase();
          return an.localeCompare(bn);
        });
      setItems(sorted);
      setSelectedRows([]);
      setOpenMenuIndex(null);
      setMenuPos(null);
    } catch (err) {
      setItems([]);
      setSelectedRows([]);
      setOpenMenuIndex(null);
      setMenuPos(null);
      setError(err?.message || "failed_to_load_files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [serverId, directory]);

  const toggleSelectAll = () => {
    if (selectedRows.length === items.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(items.map((_, idx) => idx));
    }
  };

  const toggleSelectRow = (idx) => {
    if (selectedRows.includes(idx)) {
      setSelectedRows(selectedRows.filter(i => i !== idx));
    } else {
      setSelectedRows([...selectedRows, idx]);
    }
  };

  const deleteFilesAction = async ({ rowIndex } = {}) => {
    if (!Number.isInteger(serverId) || serverId <= 0) return;

    const root = uiToApiDirectory(directory);

    const selectedNames = selectedRows
      .map(i => items?.[i]?.name)
      .filter(Boolean);

    const rowName = typeof rowIndex === 'number' ? items?.[rowIndex]?.name : null;

    const filesToDelete = selectedNames.length
      ? selectedNames
      : rowName
      ? [rowName]
      : [];

    if (!filesToDelete.length) return;

    try {
      await request(`/servers/${serverId}/files/delete`, { method: 'POST', body: { root, files: filesToDelete } });
      await fetchListing();
    } catch (err) {
      setError(err?.message || 'failed_to_delete_files');
    }
  };

  const handleRowClick = (item) => {
    const name = item?.name;
    const isFolder = item?.is_file === false || item?.is_file === 0 || item?.type === 'folder';
    if (!name) return;
    if (isFolder) {
      setDirectory(joinPath(normalizeUiDirectory(directory), name));
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#18181b" }}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-white">File Manager</h1>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium rounded-md border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-colors duration-200 cursor-pointer">
              New File
            </button>
            <button className="px-3 py-1.5 text-sm font-medium rounded-md border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-colors duration-200 cursor-pointer">
              New Folder
            </button>
            <button
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
            >
              Upload
            </button>
          </div>
        </div>

        <div className="text-sm font-mono flex items-center gap-1">
          {breadcrumb.map((c, idx) => {
            const isLast = idx === breadcrumb.length - 1;
            const label = c.label;
            return (
              <div key={`${c.path}-${idx}`} className="flex items-center gap-1">
                <span className="text-white/30">/</span>
                <button
                  onClick={() => setDirectory(apiToUiDirectory(c.path))}
                  className={isLast ? 'text-white cursor-default' : 'text-white/40 hover:text-white/70 transition-colors duration-200 cursor-pointer'}
                  disabled={isLast}
                >
                  {label}
                </button>
              </div>
            );
          })}
          <span className="text-white/30">/</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="pl-4 pr-2 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedRows.length === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-white/10 bg-black/20 text-[#14b8a6] focus:ring-[#14b8a6] focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="pl-2 pr-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Modified</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-white/10 animate-pulse">
                  <td className="pl-4 pr-2 py-4 w-10"><div className="h-4 w-4 bg-white/10 rounded" /></td>
                  <td className="pl-2 pr-4 py-4"><div className="h-3 w-48 bg-white/10 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-3 w-16 bg-white/10 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-3 w-28 bg-white/10 rounded" /></td>
                  <td className="px-4 py-4 text-right"><div className="h-6 w-6 bg-white/10 rounded ml-auto" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-12 text-center text-sm text-white/40">
                  This folder is empty
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
              <tr
                key={idx}
                onClick={() => handleRowClick(item)}
                className="border-b border-white/10 hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer"
              >
                <td className="pl-4 pr-2 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(idx)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectRow(idx);
                    }}
                    className="w-4 h-4 rounded border-white/10 bg-black/20 text-[#14b8a6] focus:ring-[#14b8a6] focus:ring-offset-0 cursor-pointer"
                  />
                </td>
                <td className="pl-2 pr-4 py-4">
                  <div className="flex items-center gap-2.5">
                    {item?.is_file ? (
                      <File size={16} className="text-white/40 shrink-0" />
                    ) : (
                      <Folder size={16} className="text-white/60 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-white">{item?.name || '-'}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-white/60">{item?.is_file ? formatBytes(item?.size) : '-'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-white/60">{formatRelativeTime(item?.modified_at)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="relative">
                    <button
                      ref={(el) => {
                        if (el) menuAnchorRefs.current[idx] = el;
                      }}
                      onClick={(e) => {
                        e.stopPropagation();

                        const next = openMenuIndex === idx ? null : idx;
                        setOpenMenuIndex(next);

                        if (next === null) {
                          setMenuPos(null);
                          return;
                        }

                        const el = menuAnchorRefs.current[idx];
                        if (!el) return;
                        const rect = el.getBoundingClientRect();
                        setMenuPos({
                          top: rect.bottom + 6,
                          right: window.innerWidth - rect.right
                        });
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer inline-flex items-center justify-center"
                    >
                      <Ellipsis size={16} className="text-white/60" />
                    </button>

                    {openMenuIndex === idx && menuPos && typeof document !== 'undefined' && createPortal(
                      <div
                        className="fixed w-36 rounded-md border border-white/10 z-[99999]"
                        style={{ backgroundColor: '#27272a', top: menuPos.top, right: menuPos.right }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1.5 px-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuIndex(null);
                              setMenuPos(null);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors duration-200 rounded-md"
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuIndex(null);
                              setMenuPos(null);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors duration-200 rounded-md"
                          >
                            Move
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuIndex(null);
                              setMenuPos(null);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors duration-200 rounded-md"
                          >
                            Permissions
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuIndex(null);
                              setMenuPos(null);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors duration-200 rounded-md"
                          >
                            Archive
                          </button>
                          <div className="h-px bg-white/10 my-1"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFilesAction({ rowIndex: idx });
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors duration-200 rounded-md"
                          >
                            Delete
                          </button>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                </td>
              </tr>
            )))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
