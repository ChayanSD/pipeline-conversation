'use client';

import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import logo from '@/public/logo.png';
export default function Sidebar() {
  const { user } = useUser();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const navigationItems = [
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

  if (user.role === 'ADMIN') {
    navigationItems.push({
      name: 'Admin Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    });
  }

  // When on add-new-audit, show Category 1-7 and hide ALL AUDITS button
  let effectiveItems = navigationItems;
  const onNewAuditPage = pathname === '/add-new-audit';
  if (onNewAuditPage) {
    const categoryItems = Array.from({ length: 7 }, (_, i) => ({
      name: `Category ${i + 1}`,
      href: `/add-new-audit?category=${i + 1}`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2 2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
      ),
    }));

    // Remove ALL AUDITS from the list and prepend categories
    const [, ...rest] = navigationItems;
    effectiveItems = [...categoryItems, ...rest];
  }

  return (
    <div 
      className="w-75  flex flex-col h-screen overflow-y-auto relative" 
      style={{ 
        width: '300px',
        backgroundImage: 'url(/bg-img.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '600px 100%',
        backgroundPosition: '0 0',
        position: 'relative'
      }}
    >
      {/*  overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 155, 255, 0.3)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Logo/Brand */}
      <div className="py-12 border-b-2 border-[#456987] flex justify-center" style={{ position: 'relative', zIndex: 2 }}>
        <Image 
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
      <nav className="py-6" style={{ position: 'relative', zIndex: 2, gap: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column' }}>
        {onNewAuditPage && (
          <div className="px-4 text-center font-medium text-[#F7FCFF]" style={{ marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)' }}>
            ALL AUDITS
          </div>
        )}
        {effectiveItems.map((item) => {
          // Active state: exact match for regular links; for category links, match by query param
          let isActive = pathname === item.href;
          if (onNewAuditPage && item.href.startsWith('/add-new-audit')) {
            const currentCategory = searchParams.get('category');
            const itemCategory = new URLSearchParams(item.href.split('?')[1]).get('category');
            isActive = currentCategory === itemCategory;
          }
          const useSecondary = onNewAuditPage && item.href.startsWith('/add-new-audit');
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`ml-4 h-[42px] cursor-pointer flex items-center text-black ${
                isActive 
                  ? 'w-[94.5%] mr-0 rounded-l-xl'  
                  : 'w-[88%] rounded-xl hover:bg-gray-100 hover:text-gray-900'
              }`}
              style={{
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
                marginLeft: 'clamp(0.75rem, 2vw, 1rem)',
                backgroundColor: useSecondary ? theme.secondary : 'white',
                  color: isActive ? (useSecondary ? 'white' : 'black') : (useSecondary ? '#76899B' : theme.primary),
                  border:  (useSecondary ? '2px solid #76899B' : 'none') ,
              }}
            >
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto overflow-hidden" style={{ position: 'relative', zIndex: 2, paddingBottom: 'clamp(1rem, 4vw, 2rem)' }}>
        <div className="flex items-center justify-center" style={{ marginBottom: 'clamp(0.75rem, 3vw, 1.25rem)' }}>
          {user.profileImageUrl ? (
            <Image
              className="rounded-full object-cover cursor-pointer"
              src={user.profileImageUrl}
              alt="Profile"
              width={180}
              height={199}
              onClick={handleLogout}
              style={{
                width: 'clamp(60px, 15vw, 244px)',
                height: 'clamp(60px, 15vw, 269px)'
              }}
            />
          ) : (
            <div 
              className="rounded bg-gray-300 flex items-center justify-center cursor-pointer"
              onClick={handleLogout}
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
