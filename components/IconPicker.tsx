'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
  className?: string;
  showButton?: boolean; // If false, only show dropdown (no button)
  isOpen?: boolean; // Controlled open state when showButton is false
  onClose?: () => void; // Callback when dropdown should close
}

// Popular lucide-react icons list (50-70 icons)
const POPULAR_ICONS = [
  'Folder', 'FileText', 'Settings', 'User', 'Users', 'BarChart', 'PieChart', 'TrendingUp',
  'Target', 'CheckCircle', 'AlertCircle', 'Info', 'Star', 'Heart', 'Bookmark', 'Tag',
  'Calendar', 'Clock', 'Bell', 'Mail', 'MessageSquare', 'Phone', 'Video', 'Camera',
  'Image', 'Music', 'Film', 'Play', 'Pause', 'Stop', 'Volume2', 'Mic',
  'Search', 'Filter', 'Grid', 'List', 'Layout', 'Zap', 'Battery', 'Wifi',
  'Lock', 'Unlock', 'Shield', 'Key', 'Eye', 'EyeOff', 'Edit', 'Trash',
  'Plus', 'Minus', 'X', 'Check', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
  'Home', 'Building', 'MapPin', 'Globe', 'Link', 'Share', 'Download', 'Upload',
  'Save', 'Copy', 'Scissors', 'Printer', 'ShoppingCart', 'CreditCard', 'DollarSign', 'Coins',
  'Briefcase', 'GraduationCap', 'Book', 'PenTool', 'Palette', 'Code', 'Database', 'Server',
  'Cloud', 'Sun', 'Moon', 'Umbrella', 'Droplet', 'Flame', 'Leaf', 'Tree',
  'Activity', 'Pulse', 'Thermometer', 'Gauge', 'Award', 'Trophy', 'Medal', 'Crown',
  'Package', 'Box', 'Archive', 'FolderOpen', 'File', 'FileCheck', 'FileX', 'FolderPlus',
  'Layers', 'LayoutDashboard', 'Menu', 'MoreHorizontal', 'MoreVertical', 'PanelLeft', 'PanelRight',
  'Rocket', 'Sparkles', 'Wand2', 'Lightbulb', 'Flag', 'Map', 'Navigation', 'Compass'
] as const;

export default function IconPicker({
  value,
  onChange,
  placeholder = 'Select an icon',
  className = '',
  showButton = true,
  isOpen: controlledIsOpen,
  onClose,
}: IconPickerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Ensure we're mounted (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use controlled isOpen if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(value);
    } else if (onClose && !value) {
      onClose();
    }
  };

  // Use hardcoded popular icons list
  const allIconNames = POPULAR_ICONS;

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return allIconNames;
    }
    const query = searchQuery.toLowerCase();
    return allIconNames.filter((iconName) =>
      iconName.toLowerCase().includes(query)
    );
  }, [allIconNames, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both the container and the portal dropdown
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(target instanceof Element && target.closest('[data-icon-picker-dropdown]'))
      ) {
        if (controlledIsOpen === undefined) {
          setInternalIsOpen(false);
        } else if (onClose) {
          onClose();
        }
        setSearchQuery('');
      }
    };

    // Use a longer delay to ensure the button click completes first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, controlledIsOpen, onClose]);

  // Calculate dropdown position when it opens and update on scroll/resize
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 250;
      const dropdownWidth = 250;
      
      let top = showButton ? rect.bottom + 4 : rect.top;
      let left = rect.left;
      
      // Adjust if dropdown would go off bottom of screen
      if (top + dropdownHeight > window.innerHeight) {
        top = showButton ? rect.top - dropdownHeight - 4 : rect.bottom - dropdownHeight;
      }
      
      // Adjust if dropdown would go off right side of screen
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      
      // Ensure it doesn't go off left side
      if (left < 10) {
        left = 10;
      }
      
      setDropdownPosition({ top, left });
    };

    updatePosition();
    
    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, showButton]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
    if (onClose) {
      onClose();
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ className?: string; size?: number }>
    >)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="w-5 h-5" />;
  };

  const selectedIconComponent = value ? getIconComponent(value) : null;

  return (
    <div 
      className={`relative ${className}`} 
      ref={containerRef}
      style={{ zIndex: isOpen ? 99999 : 'auto', position: 'relative' }}
    >
      {/* Trigger Button - only show if showButton is true */}
      {showButton && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          style={{ position: 'relative', zIndex: isOpen ? 99999 : 'auto' }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value && selectedIconComponent ? (
              <>
                {selectedIconComponent}
                <span className="text-gray-700 truncate">{value}</span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {/* Dropdown - Render via Portal to escape overflow constraints */}
      {isOpen && mounted && createPortal(
        <div
          data-icon-picker-dropdown
          className="bg-white border border-gray-300 rounded-md shadow-xl"
          style={{
            width: '250px',
            height: '250px',
            display: 'flex',
            flexDirection: 'column',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 99999,
            position: 'fixed',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
              <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search icons..."
              className="w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Icons Grid */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {filteredIcons.map((iconName) => {
                  const IconComponent = (LucideIcons as unknown as Record<
                    string,
                    React.ComponentType<{ className?: string; size?: number }>
                  >)[iconName];
                  if (!IconComponent) return null;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleIconSelect(iconName);
                      }}
                      className={`p-2 text-black bg-gray-50 rounded hover:bg-gray-100 flex items-center justify-center transition-colors ${
                        value === iconName
                          ? 'bg-green-100 border-2 border-green-500'
                          : 'border border-gray-200 hover:border-gray-300'
                      }`}
                      title={iconName}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                No icons found
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

