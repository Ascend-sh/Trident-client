import { Folder, File, Ellipsis, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import EditorModal from "../../../components/modals/editor-modal.jsx";
import PromptModal from "../../../components/modals/prompt-modal.jsx";
import ImageModal from "../../../components/modals/image-modal.jsx";
import CenterModal from "../../../components/modals/center-modal";
import UploadModal from "../../../components/modals/upload-modal.jsx";
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
  if (min < 60) return `${min}m ago`;

  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;

  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;

  const yr = Math.round(mo / 12);
  return `${yr}y ago`;
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
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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

  const [promptState, setPromptState] = useState({ open: false, type: '', title: '', desc: '', initial: '', placeholder: '', submitLabel: '', context: null });

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');

  const [deleteModalState, setDeleteModalState] = useState({ open: false, items: [] });

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

  const triggerDelete = ({ rowIndex } = {}) => {
    const selectedNames = selectedRows.map(i => items?.[i]?.name).filter(Boolean);
    const rowName = typeof rowIndex === 'number' ? items?.[rowIndex]?.name : null;

    let filesToDelete = [];
    if (typeof rowIndex === 'number' && rowName) {
      filesToDelete = selectedNames.length ? selectedNames : [rowName];
    } else {
      filesToDelete = selectedNames;
    }

    if (!filesToDelete.length) return;

    setDeleteModalState({ open: true, items: filesToDelete });
    setOpenMenuIndex(null);
    setMenuPos(null);
  };

  const confirmDelete = async () => {
    if (!serverInfo?.id || !deleteModalState.items.length) return;
    setDeleteModalState({ ...deleteModalState, open: false });

    const root = uiToApiDirectory(directory);
    const filesToDelete = deleteModalState.items;

    setError('');
    setLoading(true);

    try {
      await request(`/servers/${serverInfo.id}/files/delete`, { method: 'POST', body: { root, files: filesToDelete } });
      setSelectedRows([]);
      await fetchListing();
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'failed_to_delete_files');
    }
  };

  const openNewFilePrompt = () => {
    setPromptState({
      open: true, type: 'new_file', title: 'New File',
      desc: 'Enter a name for the new file.', initial: '',
      placeholder: 'e.g., config.yml', submitLabel: 'Create', context: null
    });
  };

  const openNewFolderPrompt = () => {
    setPromptState({
      open: true, type: 'new_folder', title: 'New Folder',
      desc: 'Enter a name for the new folder.', initial: '',
      placeholder: 'e.g., plugins', submitLabel: 'Create', context: null
    });
  };

  const openRenamePrompt = (idx) => {
    const item = items[idx];
    if (!item) return;
    setPromptState({
      open: true, type: 'rename', title: 'Rename',
      desc: 'Enter a new name for this item.', initial: item.name,
      placeholder: 'New name...', submitLabel: 'Rename',
      context: { oldName: item.name }
    });
    setOpenMenuIndex(null);
    setMenuPos(null);
  };

  const handlePromptSubmit = async (val) => {
    if (!serverInfo?.id) return;
    setError('');

    if (promptState.type === 'new_file') {
      const apiDir = uiToApiDirectory(directory);
      const filePath = joinPath(apiDir, val);
      await request(`/servers/${serverInfo.id}/files/write?file=${encodeURIComponent(filePath)}`, { method: 'POST', body: '' });
      await fetchListing();
    } else if (promptState.type === 'new_folder') {
      const root = uiToApiDirectory(directory);
      await request(`/servers/${serverInfo.id}/files/create-folder`, { method: 'POST', body: { root, name: val } });
      await fetchListing();
    } else if (promptState.type === 'rename') {
      const root = uiToApiDirectory(directory);
      const files = [{ from: promptState.context.oldName, to: val }];
      await request(`/servers/${serverInfo.id}/files/rename`, { method: 'PUT', body: { root, files } });
      await fetchListing();
    }
  };

  const handleUploadFiles = async (fileList) => {
    if (!fileList?.length || !serverInfo?.id) return;

    setError('');
    setUploading(true);

    try {
      const urlRes = await request(`/servers/${serverInfo.id}/files/upload-url`);
      let signedUrl = urlRes?.url;
      if (!signedUrl) throw new Error('invalid_upload_url');

      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('files', fileList[i]);
      }

      const apiDir = uiToApiDirectory(directory);
      if (signedUrl.includes('?')) {
        signedUrl += `&directory=${encodeURIComponent(apiDir)}`;
      } else {
        signedUrl += `?directory=${encodeURIComponent(apiDir)}`;
      }

      const uploadRes = await fetch(signedUrl, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('failed_to_upload_files');

      setUploadModalOpen(false);
      await fetchListing();
    } catch (err) {
      setError(err?.message || 'failed_to_upload_files');
    } finally {
      setUploading(false);
    }
  };

  const isTextEditable = (fileName) => {
    const n = String(fileName || '').toLowerCase();
    const allowed = [
      'txt', 'log', 'json', 'yml', 'yaml', 'properties', 'toml',
      'conf', 'cfg', 'ini', 'md', 'sh', 'env', 'xml'
    ];
    const base = n.split('/').pop() || '';
    const idx = base.lastIndexOf('.');
    const ext = idx >= 0 ? base.slice(idx + 1) : '';
    if (!ext) return true;
    return allowed.includes(ext);
  };

  const isImageViewable = (fileName) => {
    const n = String(fileName || '').toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const base = n.split('/').pop() || '';
    const idx = base.lastIndexOf('.');
    const ext = idx >= 0 ? base.slice(idx + 1) : '';
    if (!ext) return false;
    return allowed.includes(ext);
  };

  const openEditor = async ({ name }) => {
    if (!name || !isTextEditable(name) || !serverInfo?.id) return;

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
    if (!serverInfo?.id || !editorApiFile) return;

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
        } catch {}
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
      if (isTextEditable(name)) {
        openEditor({ name });
      } else if (isImageViewable(name)) {
        openImageViewer({ name });
      }
    }
  };

  const openImageViewer = async ({ name }) => {
    if (!serverInfo?.id || !name) return;

    setError('');
    setImageName(name);
    setImageUrl('');
    setImageModalOpen(true);

    try {
      const apiDir = uiToApiDirectory(directory);
      const apiFile = joinPath(apiDir, name);
      const urlRes = await request(`/servers/${serverInfo.id}/files/download?file=${encodeURIComponent(apiFile)}`);

      if (urlRes?.url) {
        setImageUrl(urlRes.url);
      } else {
        throw new Error('invalid_image_url');
      }
    } catch (err) {
      setError(err?.message || 'failed_to_load_image');
      setImageModalOpen(false);
    }
  };

  return (
    <div className="bg-surface px-10 py-10">
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

      <PromptModal
        isOpen={promptState.open}
        onClose={() => setPromptState({ ...promptState, open: false })}
        title={promptState.title}
        description={promptState.desc}
        initialValue={promptState.initial}
        placeholder={promptState.placeholder}
        submitLabel={promptState.submitLabel}
        onSubmit={handlePromptSubmit}
      />

      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => {
          setImageModalOpen(false);
          setTimeout(() => setImageUrl(''), 300);
        }}
        url={imageUrl}
        filename={imageName}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUploadFiles}
        uploading={uploading}
      />

      <CenterModal
        isOpen={deleteModalState.open}
        onClose={() => setDeleteModalState({ open: false, items: [] })}
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Delete Items</h2>
          <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-6">
            Are you sure you want to delete {deleteModalState.items.length === 1 ? 'this item' : `these ${deleteModalState.items.length} items`}? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteModalState({ open: false, items: [] })}
              className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="h-8 px-5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </CenterModal>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">File Manager</h1>
          <p className="text-[13px] font-bold text-muted-foreground mt-2">Browse and manage your server files</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={openNewFilePrompt}
            className="h-8 px-3.5 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
          >
            New File
          </button>
          <button
            onClick={openNewFolderPrompt}
            className="h-8 px-3.5 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
          >
            New Folder
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer"
          >
            Upload
          </button>
        </div>
      </div>

      <ServerNav />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar">
        {breadcrumb.map((c, idx) => {
          const isLast = idx === breadcrumb.length - 1;
          return (
            <div key={`${c.path}-${idx}`} className="flex items-center gap-1">
              <button
                onClick={() => setDirectory(apiToUiDirectory(c.path))}
                className={`text-[11px] font-bold transition-colors ${
                  isLast
                    ? 'text-foreground cursor-default'
                    : 'text-muted-foreground hover:text-foreground cursor-pointer'
                }`}
                disabled={isLast}
              >
                {c.label}
              </button>
              {!isLast && <span className="text-[11px] text-muted-foreground/30">/</span>}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
          <p className="text-[11px] font-bold text-red-500">{error}</p>
        </div>
      )}

      {/* File Table */}
      <div className="border border-surface-lighter rounded-lg">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_0.5fr] px-6 py-3 border-b border-surface-lighter">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Size</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Modified</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</span>
        </div>

        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`grid grid-cols-[1.5fr_1fr_1fr_0.5fr] px-6 py-3.5 animate-pulse ${i > 0 ? 'border-t border-surface-lighter' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-surface-lighter rounded" />
                  <div className="h-3 w-32 bg-surface-lighter rounded-md" />
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-3 w-14 bg-surface-lighter rounded-md" />
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-3 w-16 bg-surface-lighter rounded-md" />
                </div>
                <div className="flex items-center justify-end">
                  <div className="w-6 h-6 bg-surface-lighter rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex items-center justify-center">
            <span className="text-[12px] font-bold text-muted-foreground/40">This folder is empty</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleRowClick(item)}
                className={`grid grid-cols-[1.5fr_1fr_1fr_0.5fr] px-6 py-3.5 hover:bg-surface-light/50 transition-colors cursor-pointer group ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {item?.is_file ? (
                    <File size={15} className="text-muted-foreground/40 shrink-0" />
                  ) : (
                    <Folder size={15} className="text-muted-foreground/40 shrink-0" />
                  )}
                  <span className="text-[12px] font-bold text-foreground truncate tracking-tight">{item?.name || '-'}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-[11px] font-bold text-muted-foreground">{item?.is_file ? formatBytes(item?.size) : '—'}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-[11px] font-bold text-muted-foreground">{formatRelativeTime(item?.modified_at)}</span>
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
                      className="p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer"
                    >
                      <Ellipsis size={14} />
                    </button>

                    {openMenuIndex === idx && menuPos && typeof document !== 'undefined' && createPortal(
                      <div
                        className="fixed w-40 rounded-lg border border-surface-lighter shadow-xl z-[99999] overflow-hidden"
                        style={{ top: menuPos.top, right: menuPos.right, backgroundColor: 'var(--surface)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openRenamePrompt(idx); }}
                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all rounded-md"
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuIndex(null); setMenuPos(null); }}
                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all rounded-md"
                          >
                            Move
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuIndex(null); setMenuPos(null); }}
                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all rounded-md"
                          >
                            Permissions
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDelete({ rowIndex: idx });
                            }}
                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-md"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
