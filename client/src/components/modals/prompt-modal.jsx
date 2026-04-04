import { useState, useEffect, useRef } from 'react';
import CenterModal from './center-modal';

export default function PromptModal({
  isOpen,
  onClose,
  title,
  description,
  initialValue = '',
  placeholder = '',
  onSubmit,
  submitLabel = 'Confirm'
}) {
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(value.trim());
      onClose();
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CenterModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6">
        <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">{title}</h2>
        {description && (
          <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-5">{description}</p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={isSubmitting}
            className="w-full h-9 bg-surface-light/50 border border-surface-lighter rounded-md px-3 text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/20 transition-all disabled:opacity-40"
          />

          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !value.trim()}
              className="h-8 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                  Working
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </CenterModal>
  );
}
