import { useRef, useState, useCallback } from 'react';
import CenterModal from './center-modal';
import { Upload, X, File, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[16px] font-bold text-brand tracking-tight">Upload Files</h2>
            <p className="text-[11px] font-bold text-brand/30 uppercase tracking-widest mt-0.5">
              Drop files below or click to browse
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-1.5 rounded-md text-brand/20 hover:text-brand hover:bg-surface-lighter transition-all cursor-pointer disabled:opacity-30 mt-0.5"
          >
            <X size={14} />
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed transition-all duration-200 py-10 select-none ${
            uploading
              ? 'border-surface-lighter bg-surface-light/10 cursor-not-allowed opacity-50'
              : dragging
              ? 'border-brand/50 bg-brand/5 cursor-copy'
              : 'border-surface-lighter hover:border-brand/25 hover:bg-surface-light/30 bg-transparent cursor-pointer'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-brand/10' : 'bg-surface-light'}`}>
            <Upload size={18} className={`transition-colors ${dragging ? 'text-brand/70' : 'text-brand/30'}`} />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-bold text-brand/60">
              {dragging ? 'Release to add files' : 'Drag & drop your files here'}
            </p>
            <p className="text-[10px] font-bold text-brand/25 uppercase tracking-widest mt-0.5">
              or click to select
            </p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
            {selectedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-light border border-surface-lighter group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <File size={13} className="text-brand/20 shrink-0" />
                  <span className="text-[12px] font-bold text-brand truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] font-bold text-brand/25 uppercase tracking-widest">{formatBytes(file.size)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                    disabled={uploading}
                    className="p-1 rounded text-brand/20 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-30 opacity-0 group-hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <Button
            onClick={handleUpload}
            disabled={!selectedFiles.length || uploading}
            className="w-full h-9 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none disabled:opacity-40"
          >
            {uploading
              ? 'Uploading...'
              : selectedFiles.length
              ? `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
              : 'Select Files to Upload'
            }
          </Button>
        </div>
      </div>
    </CenterModal>
  );
}
