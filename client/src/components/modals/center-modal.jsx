const CenterModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />
            
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <div 
                    className={`relative w-full ${maxWidth} rounded-lg border border-white/10 animate-in fade-in zoom-in-95 duration-200`}
                    style={{ backgroundColor: "#0A1618" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center px-4 py-3 border-b border-white/10">
                        <h2 className="text-sm font-semibold text-white">{title}</h2>
                    </div>

                    <div className="p-4">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CenterModal;
