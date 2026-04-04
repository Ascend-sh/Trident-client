import React from 'react';
import CenterModal from "./center-modal";

export default function ImageModal({ isOpen, onClose, url, filename }) {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
    }
  }, [isOpen, url]);

  return (
    <CenterModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-[16px] font-bold text-foreground tracking-tight truncate">
            {filename || 'Image'}
          </h2>
          <button
            onClick={onClose}
            className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>

        <div className="relative min-h-[300px] max-h-[70vh] w-full bg-surface-light rounded-lg overflow-hidden flex items-center justify-center border border-surface-lighter">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-surface-lighter border-t-muted-foreground rounded-full animate-spin" />
            </div>
          )}

          {url && (
            <img
              src={url}
              alt={filename || 'Preview'}
              className={`max-w-full max-h-[70vh] object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          )}

          {!url && !loading && (
            <span className="text-[12px] font-bold text-muted-foreground/40">Failed to load image</span>
          )}
        </div>
      </div>
    </CenterModal>
  );
}
