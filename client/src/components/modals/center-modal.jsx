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
                    className={`relative w-full ${maxWidth} rounded-lg border border-white/10 transition-all duration-200 ${
                        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
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
