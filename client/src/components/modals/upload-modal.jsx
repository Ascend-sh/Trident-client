import { useRef, useState, useCallback } from 'react';
import CenterModal from './center-modal';
import { Upload, X, File } from 'lucide-react';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadModal({ isOpen, onClose, onUpload, uploading }) {
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !existingNames.has(f.name))];
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleInputChange = (e) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (name) => setSelectedFiles((prev) => prev.filter((f) => f.name !== name));

  const handleClose = () => {
    if (uploading) return;
    setSelectedFiles([]);
    setDragging(false);
    onClose();
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || uploading) return;
    await onUpload(selectedFiles);
    setSelectedFiles([]);
  };

  return (
    <CenterModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
      <div className="p-6">
        <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Upload Files</h2>
        <p className="text-[11px] font-bold text-muted-foreground mb-5">
          Drop files below or click to browse
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 w-full rounded-lg border-2 border-dashed transition-all py-10 select-none ${
            uploading
              ? 'border-surface-lighter opacity-40 cursor-not-allowed'
              : dragging
              ? 'border-brand/40 bg-brand/[0.03] cursor-copy'
              : 'border-surface-lighter hover:border-muted-foreground/20 cursor-pointer'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <div className={`w-9 h-9 rounded-lg border border-surface-lighter flex items-center justify-center transition-colors ${dragging ? 'bg-brand/5 border-brand/20' : 'bg-surface-light'}`}>
            <Upload size={16} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-[12px] font-bold text-muted-foreground">
              {dragging ? 'Release to add files' : 'Drag & drop files here'}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground/40 mt-0.5">
              or click to select
            </p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 border border-surface-lighter rounded-lg overflow-hidden max-h-44 overflow-y-auto">
            {selectedFiles.map((file, i) => (
              <div
                key={file.name}
                className={`flex items-center justify-between px-4 py-2.5 group hover:bg-surface-light/50 transition-colors ${i > 0 ? 'border-t border-surface-lighter' : ''}`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <File size={13} className="text-muted-foreground/40 shrink-0" />
                  <span className="text-[12px] font-bold text-foreground truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] font-bold text-muted-foreground">{formatBytes(file.size)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                    disabled={uploading}
                    className="p-1 rounded text-muted-foreground/30 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-30 opacity-0 group-hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFiles.length || uploading}
            className="h-8 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                Uploading
              </>
            ) : selectedFiles.length ? (
              `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
            ) : (
              'Select Files'
            )}
          </button>
        </div>
      </div>
    </CenterModal>
  );
}
