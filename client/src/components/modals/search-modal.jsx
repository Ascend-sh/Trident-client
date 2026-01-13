import { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context.jsx';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const getSearchItems = () => {
    const items = [
      { id: 1, title: 'Dashboard', description: 'View and manage your servers', path: '/app/home', category: 'Navigation' },
      { id: 2, title: 'Store', description: 'Browse and purchase items', path: '/app/store', category: 'Navigation' },
      { id: 3, title: 'Support', description: 'Get help and support', path: '/app/support', category: 'Navigation' },
      { id: 4, title: 'Account Settings', description: 'Manage your account preferences', path: '/app/account/settings', category: 'Account' },
      { id: 5, title: 'Security', description: 'Security and privacy settings', path: '/app/account/security', category: 'Account' },
    ];

    if (user?.isAdmin) {
      items.push(
        { id: 6, title: 'Admin Overview', description: 'Dashboard statistics and system info', path: '/app/admin/overview', category: 'Admin' },
        { id: 7, title: 'Customizations', description: 'Customize dashboard appearance', path: '/app/admin/customizations', category: 'Admin' },
        { id: 8, title: 'Locations', description: 'Manage server locations', path: '/app/admin/locations', category: 'Admin' },
        { id: 9, title: 'Nodes', description: 'Manage server nodes', path: '/app/admin/nodes', category: 'Admin' },
        { id: 10, title: 'Software Management', description: 'Manage nests and eggs', path: '/app/admin/software', category: 'Admin' }
      );
    }

    return items;
  };

  const searchItems = getSearchItems();

  const filteredItems = query.trim().length < 3
    ? []
    : searchItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
      }, 200);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      <div 
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh]"
        onClick={onClose}
      >
        <div 
          className={`w-full max-w-2xl mx-4 rounded-lg border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ backgroundColor: '#0A1618' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Search size={18} className="text-white/40 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for pages, settings, and more..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/5 transition-colors duration-200"
            >
              <X size={16} className="text-white/40" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {query.trim().length < 3 ? (
              <div className="p-8 flex items-center justify-center gap-2">
                <Sparkles size={14} className="text-white/40" />
                <p className="text-xs text-white/40">Type at least 3 characters to search</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-white/60">No results found</p>
                <p className="text-xs text-white/40 mt-1">Try searching for something else</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors duration-200 ${
                      selectedIndex === index
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                        <span className="text-[10px] text-white/40 px-1.5 py-0.5 rounded bg-white/5 flex-shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 truncate">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3 text-[10px] text-white/40">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
