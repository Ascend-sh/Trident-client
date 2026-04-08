import CenterModal from './center-modal.jsx';

export default function EditorModal({
  isOpen,
  onClose,
  path,
  value,
  onChange,
  onSave,
  saving = false,
  loading = false,
  error = '',
  notice = ''
}) {
  const filePath = typeof path === 'string' && path.trim() ? path.trim() : '';

  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-0.5">Edit File</h2>
            <p className="text-[11px] font-bold text-muted-foreground font-mono truncate">{filePath || '—'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || loading}
              className="h-8 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                  Saving
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-4 px-3 py-2.5 rounded-md bg-yellow-500/5 border border-yellow-500/10">
            <p className="text-[11px] font-bold text-yellow-600">{notice}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
            <p className="text-[11px] font-bold text-red-500">{error}</p>
          </div>
        )}

        <div className="relative border border-surface-lighter rounded-lg overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
              <div className="w-5 h-5 border-2 border-surface-lighter border-t-muted-foreground rounded-full animate-spin" />
            </div>
          )}
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            spellCheck={false}
            readOnly={loading}
            className="w-full h-[60vh] resize-none bg-surface-light text-[13px] text-foreground font-mono px-4 py-3 focus:outline-none leading-relaxed"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground/40">Unsaved changes will be lost</p>
          <p className="text-[10px] font-bold text-muted-foreground/40">ESC to close</p>
        </div>
      </div>
    </CenterModal>
  );
}
