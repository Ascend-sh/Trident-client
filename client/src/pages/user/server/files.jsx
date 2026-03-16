import { Folder, File, Ellipsis, Plus, Upload, ChevronRight, Search, FileCode, Trash2, MoreVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import EditorModal from "../../../components/modals/editor-modal.jsx";
import { Button } from "@/components/ui/button";
import ServerNav from "../../../components/navigation/server-nav";

const API_BASE = "/api/v1/client";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });

  const contentType = String(res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();

  const isJson = contentType.includes('application/json');

  let data = text;
  if (isJson) {
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
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
  const { identifier } = useParams();
  const [serverInfo, setServerInfo] = useState(null);

  const [directory, setDirectory] = useState(UI_ROOT);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const menuAnchorRefs = useRef({});
  const [menuPos, setMenuPos] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPath, setEditorPath] = useState('');
  const [editorApiFile, setEditorApiFile] = useState('');
  const [editorValue, setEditorValue] = useState('');
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [editorNotice, setEditorNotice] = useState('');

  const breadcrumb = useMemo(() => {
    const uiDir = normalizeUiDirectory(directory);
    const apiDir = uiToApiDirectory(uiDir);
    return splitBreadcrumb({ dir: apiDir });
  }, [directory]);

  useEffect(() => {
    if (!identifier) return;
    request('/servers')
      .then((res) => {
        const found = (res?.servers || []).find((s) => s.identifier === identifier);
        setServerInfo(found || null);
      })
      .catch(() => setServerInfo(null));
  }, [identifier]);

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
    if (!serverInfo?.id) return;

    setLoading(true);
    setError("");
    const apiDir = uiToApiDirectory(directory);

    try {
      const res = await request(`/servers/${serverInfo.id}/files/list?directory=${encodeURIComponent(apiDir)}`);
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
  }, [serverInfo?.id, directory]);

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
    if (!serverInfo?.id) return;

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

    setError('');
    setLoading(true);

    try {
      await request(`/servers/${serverInfo.id}/files/delete`, { method: 'POST', body: { root, files: filesToDelete } });
      await fetchListing();
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'failed_to_delete_files');
    }
  };

  const isTextEditable = (fileName) => {
    const n = String(fileName || '').toLowerCase();
    const allowed = [
      'txt',
      'log',
      'json',
      'yml',
      'yaml',
      'properties',
      'toml',
      'conf',
      'cfg',
      'ini',
      'md',
      'sh',
      'env',
      'xml'
    ];

    const base = n.split('/').pop() || '';
    const idx = base.lastIndexOf('.');
    const ext = idx >= 0 ? base.slice(idx + 1) : '';
    if (!ext) return true;
    return allowed.includes(ext);
  };

  const openEditor = async ({ name }) => {
    if (!name) return;

    if (!isTextEditable(name)) {
      return;
    }

    if (!serverInfo?.id) return;

    const apiDir = uiToApiDirectory(directory);
    const apiFile = joinPath(apiDir, name);
    const uiFile = joinPath(normalizeUiDirectory(directory), name);

    setEditorOpen(true);
    setEditorError('');
    setEditorNotice('');
    setEditorLoading(true);
    setEditorPath(uiFile);
    setEditorApiFile(apiFile);
    setEditorValue('');

    try {
      const content = await request(`/servers/${serverInfo.id}/files/contents?file=${encodeURIComponent(apiFile)}`);
      const raw = typeof content === 'string' ? content : String(content ?? '');

      const lower = String(name).toLowerCase();
      if (lower.endsWith('.json')) {
        try {
          const parsed = JSON.parse(raw);
          setEditorValue(JSON.stringify(parsed, null, 2));
        } catch {
          setEditorValue(raw);
          setEditorNotice('This file is not valid JSON. Showing raw contents.');
        }
      } else {
        setEditorValue(raw);
      }
    } catch (err) {
      setEditorError(err?.message || 'failed_to_load_file');
    } finally {
      setEditorLoading(false);
    }
  };

  const saveEditor = async () => {
    if (!serverInfo?.id) return;
    if (!editorApiFile) return;

    setEditorSaving(true);
    setEditorError('');

    try {
      const res = await fetch(`${API_BASE}/servers/${serverInfo.id}/files/write?file=${encodeURIComponent(editorApiFile)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'text/plain' },
        body: editorValue ?? ''
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = text;
        try {
          const j = JSON.parse(text);
          msg = j?.error || j?.message || msg;
        } catch {
        }
        throw new Error(msg || 'failed_to_save_file');
      }

      setEditorOpen(false);
      setEditorPath('');
      setEditorApiFile('');
      await fetchListing();
    } catch (err) {
      setEditorError(err?.message || 'failed_to_save_file');
    } finally {
      setEditorSaving(false);
    }
  };

  const handleRowClick = (item) => {
    const name = item?.name;
    const isFolder = item?.is_file === false || item?.is_file === 0 || item?.type === 'folder';
    const isFile = item?.is_file === true || item?.is_file === 1;

    if (!name) return;

    if (isFolder) {
      setDirectory(joinPath(normalizeUiDirectory(directory), name));
      return;
    }

    if (isFile) {
      openEditor({ name });
    }
  };

  return (
    <div className="bg-surface px-16 py-10 min-h-screen">
      <EditorModal
        isOpen={editorOpen}
        onClose={() => {
          if (editorSaving) return;
          setEditorOpen(false);
          setEditorError('');
          setEditorNotice('');
          setEditorLoading(false);
        }}
        path={editorPath}
        value={editorValue}
        onChange={setEditorValue}
        onSave={saveEditor}
        saving={editorSaving}
        loading={editorLoading}
        error={editorError}
        notice={editorNotice}
      />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[20px] font-bold text-brand tracking-tight">File Manager</h1>
            <p className="text-[12px] font-bold text-brand/30 uppercase tracking-widest mt-1">Direct instance filesystem access</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 text-[10px] font-bold text-brand/60 uppercase tracking-widest rounded-md border border-surface-lighter hover:bg-surface-lighter transition-all duration-200 cursor-pointer">
              New File
            </button>
            <button className="h-8 px-3 text-[10px] font-bold text-brand/60 uppercase tracking-widest rounded-md border border-surface-lighter hover:bg-surface-lighter transition-all duration-200 cursor-pointer">
              New Folder
            </button>
            <button
              className="h-8 px-4 text-[10px] font-bold bg-brand text-surface hover:bg-brand/90 transition-all rounded-md uppercase tracking-widest cursor-pointer shadow-none"
            >
              Upload
            </button>
          </div>
        </div>

        <ServerNav />

        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto no-scrollbar">
          {breadcrumb.map((c, idx) => {
            const isLast = idx === breadcrumb.length - 1;
            return (
              <div key={`${c.path}-${idx}`} className="flex items-center gap-1.5">
                <button
                  onClick={() => setDirectory(apiToUiDirectory(c.path))}
                  className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    isLast 
                      ? 'text-brand cursor-default' 
                      : 'text-brand/30 hover:text-brand/60 cursor-pointer'
                  }`}
                  disabled={isLast}
                >
                  {c.label}
                </button>
                {!isLast && <span className="text-[10px] font-bold text-brand">/</span>}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
        <div className="w-full">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_0.5fr] px-6 py-3">
            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Name</span>
            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-center">Size</span>
            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-center">Modified</span>
            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-right">Actions</span>
          </div>
          <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col divide-y divide-surface-lighter">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 border-b border-surface-lighter animate-pulse bg-brand/[0.01] grid grid-cols-[1.5fr_1fr_1fr_0.5fr] px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-brand/5 rounded" />
                    <div className="h-3 w-32 bg-brand/5 rounded" />
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="h-3 w-16 bg-brand/5 rounded" />
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="h-3 w-24 bg-brand/5 rounded" />
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="h-6 w-6 bg-brand/5 rounded" />
                  </div>
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-[12px] font-bold text-brand/40 italic">This folder is empty</span>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleRowClick(item)}
                  className="grid grid-cols-[1.5fr_1fr_1fr_0.5fr] px-6 py-3.5 hover:bg-surface-light/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {item?.is_file ? (
                      <File size={16} className="text-brand/30 shrink-0" />
                    ) : (
                      <Folder size={16} className="text-brand/50 shrink-0" />
                    )}
                    <span className="text-[12px] font-bold text-brand truncate tracking-tight">{item?.name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">{item?.is_file ? formatBytes(item?.size) : '-'}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">{formatRelativeTime(item?.modified_at)}</span>
                  </div>
                  <div className="flex items-center justify-end">
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
                        className="p-1.5 rounded-md hover:bg-surface-lighter text-brand/20 hover:text-brand/60 transition-all cursor-pointer"
                      >
                        <Ellipsis size={14} />
                      </button>

                      {openMenuIndex === idx && menuPos && typeof document !== 'undefined' && createPortal(
                        <div
                          className="fixed w-36 rounded-md border border-surface-lighter shadow-xl z-[99999] overflow-hidden bg-white"
                          style={{ top: menuPos.top, right: menuPos.right }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="py-1 px-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenuIndex(null); setMenuPos(null); }}
                              className="w-full px-2.5 py-1.5 text-left text-[11px] font-bold text-brand/60 hover:text-brand hover:bg-surface-light transition-all rounded-md uppercase tracking-tight"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenuIndex(null); setMenuPos(null); }}
                              className="w-full px-2.5 py-1.5 text-left text-[11px] font-bold text-brand/60 hover:text-brand hover:bg-surface-light transition-all rounded-md uppercase tracking-tight"
                            >
                              Move
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenuIndex(null); setMenuPos(null); }}
                              className="w-full px-2.5 py-1.5 text-left text-[11px] font-bold text-brand/60 hover:text-brand hover:bg-surface-light transition-all rounded-md uppercase tracking-tight"
                            >
                              Permissions
                            </button>
                            <div className="h-px bg-surface-lighter my-1"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFilesAction({ rowIndex: idx });
                              }}
                              className="w-full px-2.5 py-1.5 text-left text-[11px] font-bold text-red-500/60 hover:text-red-500 hover:bg-red-50 transition-all rounded-md uppercase tracking-tight"
                            >
                              Delete
                            </button>
                          </div>
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
