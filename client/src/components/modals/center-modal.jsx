import { motion, AnimatePresence } from 'framer-motion';

const CenterModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-[2px]"
                        onClick={onClose}
                    />
                    
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 400, 
                                damping: 30,
                                opacity: { duration: 0.15 }
                            }}
                            className={`relative w-full ${maxWidth} rounded-xl border border-surface-light bg-surface shadow-2xl pointer-events-auto overflow-hidden`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {title && (
                                <div className="flex items-center px-4 py-3 border-b border-surface-light bg-surface-light/30">
                                    <h2 className="text-[10px] font-bold text-brand uppercase tracking-wider">{title}</h2>
                                </div>
                            )}

                            <div className={title ? "p-0" : ""}>
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CenterModal;


