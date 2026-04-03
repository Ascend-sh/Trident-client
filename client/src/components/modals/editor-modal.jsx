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
      title="Edit File"
      maxWidth="max-w-4xl"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Path</p>
            <p className="text-[11px] text-foreground font-mono truncate">{filePath || '-'}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/60 hover:text-brand rounded-lg border border-surface-light hover:border-surface-lighter transition-colors duration-200 cursor-pointer shadow-none"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || loading}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 bg-brand text-surface shadow-none"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Save
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>

        {notice ? (
          <div className="mb-4 px-4 py-2 rounded-lg border border-yellow-500/10 bg-yellow-500/5">
            <p className="text-[11px] font-medium text-yellow-700">{notice}</p>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 px-4 py-2 rounded-lg border border-red-500/10 bg-red-500/5">
            <p className="text-[11px] font-medium text-red-700">{error}</p>
          </div>
        ) : null}

        <div className="relative rounded-lg border border-surface-light overflow-hidden bg-surface-light/30">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="h-6 w-6 rounded-full border-2 border-surface-light border-t-white/60 animate-spin" />
            </div>
          ) : null}

          <textarea
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            spellCheck={false}
            readOnly={loading}
            className="w-full h-[60vh] resize-none bg-transparent text-[13px] text-foreground/60 font-mono px-4 py-3 focus:outline-none leading-relaxed"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/60">Changes are not saved until you click Save</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/60">esc closes</p>
        </div>
      </div>
    </CenterModal>
  );
}
