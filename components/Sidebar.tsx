'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import logo from '@/public/logo.png';
import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  categoryNumber?: number;
};

export default function Sidebar() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [categoryNames, setCategoryNames] = useState<Record<number, string>>({});

  // Helper function to convert hex to rgba with opacity (same as BackgroundWrapper)
  const hexToRgba = (hex: string, opacity: number): string => {
    const cleanHex = hex.replace('#', '');
    let fullHex = cleanHex;
    if (cleanHex.length === 3) {
      fullHex = cleanHex.split('').map(char => char + char).join('');
    }
    if (fullHex.length !== 6) return hex;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Get user's primary color with opacity
  const primaryColor = user?.primaryColor || '#2B4055';
  const primaryColorWithOpacity = hexToRgba(primaryColor, 0.8); // 80% opacity for background

  // Load category names from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadCategoryNames = () => {
      const names: Record<number, string> = {};
      for (let i = 1; i <= 7; i++) {
        try {
          const storedName = sessionStorage.getItem(`auditData:categoryName:${i}`);
          if (storedName && storedName.trim()) {
            names[i] = storedName;
          } else {
            // Try to get from auditData categories array
            const raw = sessionStorage.getItem('auditData');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed?.categories)) {
                const cat = parsed.categories[i - 1];
                if (cat?.name) {
                  names[i] = cat.name;
                }
              }
            }
          }
        } catch {}
      }
      setCategoryNames(names);
    };

    loadCategoryNames();

    // Listen for storage changes from other components (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('auditData:categoryName:')) {
        loadCategoryNames();
      }
    };

    // Listen for custom event from same tab (when sidebar updates category name)
    const handleCategoryNameUpdate = () => {
      loadCategoryNames();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('categoryNameUpdated', handleCategoryNameUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categoryNameUpdated', handleCategoryNameUpdate);
    };
  }, []);

  // Helper to get category name
  const getCategoryName = (categoryNumber: number): string => {
    if (categoryNames[categoryNumber]) {
      return categoryNames[categoryNumber];
    }
    if (typeof window === 'undefined') return `Category ${categoryNumber}`;
    try {
      const storedName = sessionStorage.getItem(`auditData:categoryName:${categoryNumber}`);
      if (storedName && storedName.trim()) {
        return storedName;
      }
      const raw = sessionStorage.getItem('auditData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.categories)) {
          const cat = parsed.categories[categoryNumber - 1];
          if (cat?.name) {
            return cat.name;
          }
        }
      }
    } catch {}
    return `Category ${categoryNumber}`;
  };

  // Handle category name update
  const handleCategoryNameUpdate = (categoryNumber: number, newName: string) => {
    const finalName = newName.trim() || `Category ${categoryNumber}`;
    
    // Update state
    setCategoryNames(prev => ({ ...prev, [categoryNumber]: finalName }));
    
    // Update sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`auditData:categoryName:${categoryNumber}`, finalName);
      
      // Also update auditData categories array
      try {
        const raw = sessionStorage.getItem('auditData');
        const data = raw ? JSON.parse(raw) : { categories: [] };
        if (!Array.isArray(data.categories)) data.categories = [];
        
        const idx = categoryNumber - 1;
        while (data.categories.length < categoryNumber) {
          data.categories.push({ name: `Category ${data.categories.length + 1}`, questions: [] });
        }
        
        if (data.categories[idx]) {
          data.categories[idx].name = finalName;
        } else {
          data.categories[idx] = { name: finalName, questions: [] };
        }
        
        sessionStorage.setItem('auditData', JSON.stringify(data));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('categoryNameUpdated'));
      } catch (e) {
        console.error('Error updating category name:', e);
      }
    }
    
    setEditingCategory(null);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      window.location.href = '/signin';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/signin';
    }
  };

  if (!user) {
    return null;
  }

  const navigationItems: NavigationItem[] = [
    {
      name: 'ALL AUDITS',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
    },
  ];

  // if (user.role === 'ADMIN') {
  //   navigationItems.push({
  //     name: 'Admin Dashboard',
  //     href: '/dashboard',
  //     icon: (
  //       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  //       </svg>
  //     ),
  //   });
  // }

  // When on add-new-audit, update-audit, or test page, show Category 1-7 and hide ALL AUDITS button
  let effectiveItems = navigationItems;
  const onNewAuditPage = pathname === '/add-new-audit';
  const onUpdateAuditPage = pathname === '/update-audit';
  const onTestPage = pathname === '/test';
  if (onNewAuditPage || onUpdateAuditPage || onTestPage) {
    const editId = searchParams.get('edit');
    const presentationId = searchParams.get('presentationId');
    let basePath = '/add-new-audit';
    if (onUpdateAuditPage) basePath = '/update-audit';
    if (onTestPage) basePath = '/test';
    
    const categoryItems = Array.from({ length: 7 }, (_, i) => {
      const categoryNumber = i + 1;
      const query = new URLSearchParams();
      if (onUpdateAuditPage && editId) query.set('edit', editId);
      if (onTestPage && presentationId) query.set('presentationId', presentationId);
      query.set('category', String(categoryNumber));
      return {
        categoryNumber,
        name: getCategoryName(categoryNumber),
        href: `${basePath}?${query.toString()}`,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2 2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        ),
      };
    });

    // Remove ALL AUDITS from the list and prepend categories
    const [, ...rest] = navigationItems;
    effectiveItems = [...categoryItems, ...rest];
  }

  return (
    <div 
      className="w-75  flex flex-col h-screen overflow-y-auto relative" 
      style={{ 
        width: '300px',
        position: 'relative',
        backgroundColor: 'transparent'
      }}
    >
      {/* Logo/Brand */}
      <div className="py-12 border-b-2 border-[#456987] flex justify-center" style={{ position: 'relative', zIndex: 2 }}>
        <Image 
        onClick={() => router.push('/')}
        className="cursor-pointer"
          src={logo} 
          alt="Logo" 
          width={168} 
          height={60} 
          style={{ 
            width: 'clamp(120px, 15vw, 168px)', 
            height: 'clamp(40px, 8vw, 60px)',
            objectFit: 'contain'
          }} 
        />
      </div>

      {/* Navigation */}
      <nav className="pt-4" style={{ position: 'relative', zIndex: 2, gap: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column' }}>
        {(onNewAuditPage || onUpdateAuditPage || onTestPage) && (
          <div className="px-4 text-center font-medium text-[#fffef7]" style={{ marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)' }}>
            ALL AUDITS
          </div>
        )}
        {effectiveItems.map((item) => {
          // Active state: exact match for regular links; for category links, match by query param
          let isActive = pathname === item.href;
          const isCategoryItem = 'categoryNumber' in item && typeof item.categoryNumber === 'number';
          const itemCategoryNumber = isCategoryItem && item.categoryNumber !== undefined ? item.categoryNumber : null;
          if ((onNewAuditPage && item.href.startsWith('/add-new-audit')) || 
              (onUpdateAuditPage && item.href.startsWith('/update-audit')) ||
              (onTestPage && item.href.startsWith('/test'))) {
            const currentCategory = searchParams.get('category');
            const itemCategory = new URLSearchParams(item.href.split('?')[1]).get('category');
            isActive = currentCategory === itemCategory;
          }
          const useSecondary = ((onNewAuditPage && item.href.startsWith('/add-new-audit')) || 
                                (onUpdateAuditPage && item.href.startsWith('/update-audit')) ||
                                (onTestPage && item.href.startsWith('/test')));
          const isEditing = itemCategoryNumber !== null && editingCategory === itemCategoryNumber;
          
          return (
            <div
              key={item.name}
              className={`ml-4 h-[40px]  flex items-center ${
                isActive 
                  ? 'w-[94.5%] mr-0 rounded-l-xl'  
                  : 'w-[88%] rounded-xl'
              }`}
              style={{
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
                marginLeft: 'clamp(0.75rem, 2vw, 1rem)',
                backgroundColor: useSecondary ? primaryColorWithOpacity : 'white',
                color: isActive ? (useSecondary ? 'white' : 'black') : (useSecondary ? '#ffffff80' : primaryColor),
                border: (useSecondary ? '2px solid ##899AA9' : 'none'),
              }}
            >
              {isEditing && itemCategoryNumber !== null ? (
                <input
                  type="text"
                  defaultValue={getCategoryName(itemCategoryNumber)}
                  autoFocus
                  onBlur={(e) => {
                    if (itemCategoryNumber !== null) {
                      handleCategoryNameUpdate(itemCategoryNumber, e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (itemCategoryNumber !== null) {
                      if (e.key === 'Enter') {
                        handleCategoryNameUpdate(itemCategoryNumber, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        setEditingCategory(null);
                      }
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent border border-white/50 rounded px-20 py-1 outline-none"
                  style={{ color: 'inherit' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (!isEditing) {
                        router.push(item.href);
                      }
                    }}
                    className="flex-1 h-full cursor-pointer flex items-center text-left"
                    style={{ color: 'inherit' }}
                  >
                    {item.name}
                  </button>
                  {isCategoryItem && itemCategoryNumber !== null && (onNewAuditPage || onUpdateAuditPage || onTestPage) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(itemCategoryNumber);
                      }}
                      className="p-1 rounded hover:bg-white/20 cursor-pointer flex items-center"
                      style={{ color: 'inherit' }}
                      aria-label="Edit category name"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto overflow-hidden" style={{ position: 'relative', zIndex: 2, paddingBottom: 'clamp(1rem, 4vw, 2rem)' }}>
        <div className="flex items-center justify-center" style={{ marginBottom: 'clamp(0.75rem, 3vw, 1.25rem)' }}>
          {user.profileImageUrl ? (
            <Image
              className="rounded-lg w-[180px] h-[199px] object-cover cursor-pointer"
              src={user.profileImageUrl}
              alt="Profile"
              width={180}
              height={199}
              onClick={() => router.push('/profile')}
              style={{
                width: 'clamp(60px, 15vw, 180px)',
                height: 'clamp(60px, 15vw, 199px)'
              }}
            />
          ) : (
            <div 
              className="rounded bg-gray-300 flex items-center justify-center cursor-pointer"
              onClick={() => router.push('/profile')}
              style={{
                width: 'clamp(60px, 15vw, 180px)',
                height: 'clamp(60px, 15vw, 199px)'
              }}
            >
              <span className="font-medium text-gray-700" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <p 
          className="font-medium text-white text-center underline cursor-pointer" 
          style={{ 
            fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
            marginTop: 'clamp(0.75rem, 3vw, 1.25rem)'
          }} 
          onClick={handleLogout}
        >
          Logout
        </p>
      </div>
    </div>
  );
}
