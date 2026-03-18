import { useState, useEffect, useRef } from 'react';
import CenterModal from './center-modal';
import { Button } from '@/components/ui/button';

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
        <div className="mb-5">
          <h2 className="text-[16px] font-bold text-brand tracking-tight">{title}</h2>
          {description && (
            <p className="text-[11px] font-bold text-brand/30 uppercase tracking-widest mt-0.5">{description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={isSubmitting}
            className="w-full h-9 bg-surface-light border border-surface-lighter rounded-md px-3 text-[12px] font-bold text-brand placeholder:text-brand/25 focus:outline-none focus:border-brand/30 transition-colors disabled:opacity-50"
          />

          <div className="flex items-center justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-[10px] font-bold text-brand/40 hover:text-brand uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={isSubmitting || !value.trim()}
              className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none disabled:opacity-40"
            >
              {isSubmitting ? 'Working...' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </CenterModal>
  );
}
