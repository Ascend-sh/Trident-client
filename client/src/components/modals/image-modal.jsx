import React from 'react';
import CenterModal from "./center-modal";
import { Loader2 } from "lucide-react";

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-foreground tracking-tight truncate pr-4">
            {filename || 'Image Viewer'}
          </h2>
          <button
            onClick={onClose}
            className="text-[12px] font-bold text-foreground/60 hover:text-brand uppercase tracking-widest transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
        
        <div className="relative min-h-[300px] max-h-[70vh] w-full bg-surface-dark/50 rounded-lg overflow-hidden flex items-center justify-center border border-surface-lighter">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-foreground/60 animate-spin" />
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
            <span className="text-[12px] font-bold text-red-500 uppercase tracking-widest">Failed to load image</span>
          )}
        </div>
      </div>
    </CenterModal>
  );
}
