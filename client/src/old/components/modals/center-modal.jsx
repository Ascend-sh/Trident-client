import { useState, useEffect } from 'react';

const CenterModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-200 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />
            
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-6"
                onClick={onClose}
            >
                <div 
                    className={`relative w-full ${maxWidth} rounded-lg border border-surface-light transition-all duration-200 bg-surface ${
                        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {title && (
                        <div className="flex items-center px-4 py-3 border-b border-surface-light">
                            <h2 className="text-sm font-semibold text-white">{title}</h2>
                        </div>
                    )}

                    <div className={title ? "p-4" : ""}>
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CenterModal;


