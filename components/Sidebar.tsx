'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLogout } from '@/lib/hooks';
import Image from 'next/image';
import logo from '@/public/logo.png';
import { useState, useEffect } from 'react';
import { FiEdit } from 'react-icons/fi';
import summary from '@/public/summary.png';
import { CustomButton } from './common';
import toast from 'react-hot-toast';
import IconPicker from './IconPicker';
import * as LucideIcons from 'lucide-react';
type NavigationItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  categoryNumber?: number;
};

export default function Sidebar() {
  const { user, isInvitedUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingIconCategory, setEditingIconCategory] = useState<number | null>(null);
  const [categoryNames, setCategoryNames] = useState<Record<number, string>>({});
  const [categoryIcons, setCategoryIcons] = useState<Record<number, string>>({});
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);
  const [actualCategoryCount, setActualCategoryCount] = useState<number>(7);
  const [dragHandleCategory, setDragHandleCategory] = useState<number | null>(null);
  
  // Load test result data for summary overview
  const [testResultData, setTestResultData] = useState<{
    totalScore: number;
    categoryScores: Array<{
      categoryId: string;
      categoryName: string;
      score: number;
      maxScore: number;
    }>;
  } | null>(null);

  // Get user's primary color with opacity
  const primaryColor = user?.primaryColor || '#2B4055';
  const secondaryColor = user?.secondaryColor || '#F7AF41';

  // Load test result data for summary overview
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadTestResult = () => {
      try {
        const stored = sessionStorage.getItem('testResultData');
        if (stored) {
          setTestResultData(JSON.parse(stored));
        } else {
          setTestResultData(null);
        }
      } catch {
        setTestResultData(null);
      }
    };
    loadTestResult();
    window.addEventListener('testResultUpdated', loadTestResult);
    return () => window.removeEventListener('testResultUpdated', loadTestResult);
  }, []);

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

  // Calculate actual category count for create mode and test mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const calculateCategoryCount = () => {
      const onNewAuditPage = pathname === '/add-new-audit';
      const onTestPage = pathname === '/test';
      const presentationId = searchParams.get('presentationId');
      
      // Only calculate for create mode or test mode
      if (!onNewAuditPage && !(onTestPage && presentationId)) {
        setActualCategoryCount(7); // Default to 7 for update mode
        return;
      }
      
      try {
        let count = 0;
        
        if (onNewAuditPage) {
          // Create mode: Count categories with questions
          const raw = sessionStorage.getItem('auditData');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.categories)) {
              const actualCategories = parsed.categories.filter((cat: { questions?: Array<{ text?: string }> }) => {
                return cat.questions && Array.isArray(cat.questions) && cat.questions.some((q: { text?: string }) => q.text && q.text.trim().length > 0);
              });
              count = Math.max(1, actualCategories.length);
            }
          }
        } else if (onTestPage && presentationId) {
          // Test mode: Count categories with names
          for (let i = 1; i <= 7; i++) {
            const categoryName = sessionStorage.getItem(`auditData:categoryName:${i}`);
            if (categoryName && categoryName.trim()) {
              count++;
            }
          }
          // Fallback to auditData if no names found
          if (count === 0) {
            const raw = sessionStorage.getItem('auditData');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed?.categories)) {
                count = parsed.categories.length;
              }
            }
          }
        }
        
        if (count > 0) {
          setActualCategoryCount(count);
        } else {
          setActualCategoryCount(7); // Default if nothing found
        }
      } catch {
        setActualCategoryCount(7);
      }
    };

    calculateCategoryCount();
    
    // Listen for category updates
    const handleCategoryUpdate = () => {
      calculateCategoryCount();
    };
    
    window.addEventListener('categoryNameUpdated', handleCategoryUpdate);
    window.addEventListener('storage', handleCategoryUpdate);
    
    return () => {
      window.removeEventListener('categoryNameUpdated', handleCategoryUpdate);
      window.removeEventListener('storage', handleCategoryUpdate);
    };
  }, [pathname, searchParams]);

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

  // Helper to get category icon
  const getCategoryIcon = (categoryNumber: number): string | undefined => {
    if (categoryIcons[categoryNumber]) {
      return categoryIcons[categoryNumber];
    }
    if (typeof window === 'undefined') return undefined;
    try {
      const storedIcon = sessionStorage.getItem(`auditData:categoryIcon:${categoryNumber}`);
      if (storedIcon && storedIcon.trim()) {
        return storedIcon;
      }
      const raw = sessionStorage.getItem('auditData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.categories)) {
          const cat = parsed.categories[categoryNumber - 1];
          if (cat?.icon) {
            return cat.icon;
          }
        }
      }
    } catch {}
    return undefined;
  };

  // Helper to render icon component
  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="w-5 h-5" />;
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

  // Handle category icon update
  const handleCategoryIconUpdate = (categoryNumber: number, iconName: string) => {
    setCategoryIcons(prev => ({ ...prev, [categoryNumber]: iconName }));
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`auditData:categoryIcon:${categoryNumber}`, iconName);
      
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
          data.categories[idx].icon = iconName;
        } else {
          data.categories[idx] = { name: `Category ${categoryNumber}`, icon: iconName, questions: [] };
        }
        
        sessionStorage.setItem('auditData', JSON.stringify(data));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('categoryNameUpdated'));
      } catch (e) {
        console.error('Error updating category icon:', e);
      }
    }
    
    setEditingIconCategory(null);
  };

  // Handle category drag and drop reordering (only on update-audit page)
  const handleCategoryDragStart = (e: React.DragEvent, categoryIndex: number) => {
    if (pathname !== '/update-audit') return;
    // Don't start drag if clicking on input, button, or other interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('input') || target.closest('button')) {
      e.preventDefault();
      return;
    }
    setDraggedCategoryIndex(categoryIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', categoryIndex.toString());
  };

  const handleCategoryDragOver = (e: React.DragEvent, categoryIndex: number) => {
    if (pathname !== '/update-audit' || draggedCategoryIndex === null) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (categoryIndex !== draggedCategoryIndex) {
      setDragOverCategoryIndex(categoryIndex);
    }
  };

  const handleCategoryDragLeave = () => {
    setDragOverCategoryIndex(null);
  };

  const handleCategoryDrop = (e: React.DragEvent, targetIndex: number) => {
    if (pathname !== '/update-audit' || draggedCategoryIndex === null) {
      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    // Use the dragOverCategoryIndex if available, otherwise use targetIndex
    // This ensures we use the last category we dragged over, not necessarily where we dropped
    const finalTargetIndex = dragOverCategoryIndex !== null ? dragOverCategoryIndex : targetIndex;
    
    if (draggedCategoryIndex === finalTargetIndex) {
      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
      return;
    }

    // Reorder categories in sessionStorage - move entire category with all its data
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('auditData');
        const data = raw ? JSON.parse(raw) : { categories: [] };
        if (!Array.isArray(data.categories)) data.categories = [];

        // Ensure we have 7 categories
        while (data.categories.length < 7) {
          data.categories.push({ name: `Category ${data.categories.length + 1}`, questions: [] });
        }

        // Step 1: Save all data for all categories (old positions)
        const categoryDataMap: Record<number, {
          name: string;
          categoryData: string | null;
          questions: Record<number, string>;
          statuses: Record<number, string>;
        }> = {};

        for (let catNum = 1; catNum <= 7; catNum++) {
          const categoryData = sessionStorage.getItem(`auditData:category:${catNum}`);
          const categoryName = sessionStorage.getItem(`auditData:categoryName:${catNum}`);
          const questions: Record<number, string> = {};
          const statuses: Record<number, string> = {};

          // Save all questions for this category
          for (let qNum = 1; qNum <= 10; qNum++) {
            const question = sessionStorage.getItem(`auditData:question:${catNum}:${qNum}`);
            const status = sessionStorage.getItem(`auditData:status:${catNum}:${qNum}`);
            if (question) questions[qNum] = question;
            if (status) statuses[qNum] = status;
          }

          categoryDataMap[catNum] = {
            name: categoryName || `Category ${catNum}`,
            categoryData,
            questions,
            statuses,
          };
        }

        // Step 2: Reorder categories array
        // Create a proper reordering that moves the dragged item to the exact target position
        const newCategories = [...data.categories];
        const draggedCategory = newCategories[draggedCategoryIndex];
        
        // Calculate the correct target index for insertion
        // Remove the dragged item first
        newCategories.splice(draggedCategoryIndex, 1);
        
        // Calculate adjusted target index after removal
        // When dragging down (lower index to higher), after removal the target shifts down by 1
        // When dragging up (higher index to lower), the target position doesn't shift
        let adjustedTargetIndex: number;
        
        if (draggedCategoryIndex < finalTargetIndex) {
          // Dragging from lower index to higher index (dragging down in the list)
          // Example: drag index 0 to index 4 (want item at position 5, which is index 4)
          // Original: [cat1,cat2,cat3,cat4,cat5,cat6,cat7] (indices 0-6)
          // After removal: [cat2,cat3,cat4,cat5,cat6,cat7] (indices 0-5)
          // What was at index 4 (cat5) is now at index 3
          // To insert at the position that was index 4, we need index 3
          // But we want to insert AFTER cat5, so we need index 4 (which is now cat6's position)
          // Actually, we want to REPLACE cat5's position, so we need index 3
          // But user says it goes 1 step up, so maybe we want index 4?
          // Let's try: if user drags to category 5 (index 4), they want it AT position 5
          // After removal, to insert AT position 5 (index 4 in new array), we use index 4
          adjustedTargetIndex = finalTargetIndex; // Try without subtraction
        } else {
          // Dragging from higher index to lower index (dragging up in the list)
          // Example: drag index 6 to index 0
          // Original: [cat1,cat2,cat3,cat4,cat5,cat6,cat7] (indices 0-6)
          // After removal: [cat1,cat2,cat3,cat4,cat5,cat6] (indices 0-5)
          // Index 0 is still at index 0, so we use finalTargetIndex directly
          adjustedTargetIndex = finalTargetIndex;
        }
        
        // Insert at the adjusted target position
        newCategories.splice(adjustedTargetIndex, 0, draggedCategory);
        data.categories = newCategories;

        // Step 3: Create mapping from old position to new position
        // Build the mapping based on the actual reordering
        const oldToNewMap: Record<number, number> = {};
        
        // Create array of original indices [0, 1, 2, 3, 4, 5, 6]
        const originalIndices = Array.from({ length: 7 }, (_, i) => i);
        
        // Simulate the reordering to get final positions
        const finalIndices = [...originalIndices];
        finalIndices.splice(draggedCategoryIndex, 1);
        finalIndices.splice(adjustedTargetIndex, 0, draggedCategoryIndex);
        
        // Create mapping: old position -> new position
        originalIndices.forEach((originalIndex) => {
          const oldCatNum = originalIndex + 1; // Convert to 1-based category number
          const newArrayIndex = finalIndices.indexOf(originalIndex);
          const newCatNum = newArrayIndex + 1; // Convert to 1-based category number
          oldToNewMap[oldCatNum] = newCatNum;
        });

        // Step 4: Clear all existing category data
        for (let catNum = 1; catNum <= 7; catNum++) {
          sessionStorage.removeItem(`auditData:category:${catNum}`);
          sessionStorage.removeItem(`auditData:categoryName:${catNum}`);
          for (let qNum = 1; qNum <= 10; qNum++) {
            sessionStorage.removeItem(`auditData:question:${catNum}:${qNum}`);
            sessionStorage.removeItem(`auditData:status:${catNum}:${qNum}`);
          }
        }

        // Step 5: Write all data to new positions
        for (let oldCatNum = 1; oldCatNum <= 7; oldCatNum++) {
          const newCatNum = oldToNewMap[oldCatNum];
          const oldData = categoryDataMap[oldCatNum];

          // Write category name
          sessionStorage.setItem(`auditData:categoryName:${newCatNum}`, oldData.name);

          // Write category data
          if (oldData.categoryData) {
            sessionStorage.setItem(`auditData:category:${newCatNum}`, oldData.categoryData);
          } else {
            // If no category data exists, create from questions and statuses
            const questionsArray = Object.keys(oldData.questions).map(qNum => {
              const questionText = oldData.questions[Number(qNum)];
              const statusData = oldData.statuses[Number(qNum)];
              const options = statusData 
                ? JSON.parse(statusData).map((text: string, idx: number) => ({ text, points: idx + 1 }))
                : Array.from({ length: 5 }, (_, idx) => ({ text: `Option ${idx + 1}`, points: idx + 1 }));
              
              return {
                text: questionText || '',
                options,
              };
            }).filter(q => q.text);

            const categoryObj = {
              name: oldData.name,
              questions: questionsArray,
            };
            sessionStorage.setItem(`auditData:category:${newCatNum}`, JSON.stringify(categoryObj));
          }

          // Write all questions
          Object.keys(oldData.questions).forEach(qNum => {
            sessionStorage.setItem(`auditData:question:${newCatNum}:${qNum}`, oldData.questions[Number(qNum)]);
          });

          // Write all statuses
          Object.keys(oldData.statuses).forEach(qNum => {
            sessionStorage.setItem(`auditData:status:${newCatNum}:${qNum}`, oldData.statuses[Number(qNum)]);
          });
        }

        // Step 6: Update main auditData with reordered categories
        // Rebuild categories array from sessionStorage to ensure consistency
        const reorderedCategories = newCategories.map((cat, index) => {
          const categoryNumber = index + 1;
          const categoryDataStr = sessionStorage.getItem(`auditData:category:${categoryNumber}`);
          if (categoryDataStr) {
            try {
              return JSON.parse(categoryDataStr);
            } catch {
              return cat;
            }
          }
          return cat;
        });

        data.categories = reorderedCategories;
        sessionStorage.setItem('auditData', JSON.stringify(data));

        // Step 7: Reorder summary data (categoryRecommendations) to match new category order
        const summaryDataStr = sessionStorage.getItem('summaryData');
        if (summaryDataStr) {
          try {
            const summaryData = JSON.parse(summaryDataStr);
            if (summaryData.categoryRecommendations && Array.isArray(summaryData.categoryRecommendations)) {
              const oldRecommendations: Array<{ categoryId: string; recommendation: string }> = summaryData.categoryRecommendations;
              const reorderedRecommendations: Array<{ categoryId: string; recommendation: string }> = [];

              // Build new recommendations array based on oldToNewMap
              for (let oldPos = 1; oldPos <= oldRecommendations.length; oldPos++) {
                const recommendation = oldRecommendations[oldPos - 1];
                if (!recommendation) continue;

                const newPos = oldToNewMap[oldPos] ?? oldPos;
                const newCategory = reorderedCategories[newPos - 1];
                const newCategoryId = newCategory?.id || recommendation.categoryId || '';

                reorderedRecommendations[newPos - 1] = {
                  categoryId: newCategoryId,
                  recommendation: recommendation.recommendation || "",
                };
              }

              // Ensure array has entries for all categories
              for (let idx = 0; idx < reorderedCategories.length; idx++) {
                if (!reorderedRecommendations[idx]) {
                  reorderedRecommendations[idx] = {
                    categoryId: reorderedCategories[idx]?.id || '',
                    recommendation: "",
                  };
                }
              }

              summaryData.categoryRecommendations = reorderedRecommendations;
              sessionStorage.setItem('summaryData', JSON.stringify(summaryData));
              window.dispatchEvent(new Event('summaryDataUpdated'));
            }
          } catch (error) {
            console.error('Error reordering summary data:', error);
            // Don't fail the category reorder if summary update fails
          }
        }

        // Step 8: Reload category names for UI
        const names: Record<number, string> = {};
        for (let i = 1; i <= 7; i++) {
          const name = sessionStorage.getItem(`auditData:categoryName:${i}`);
          names[i] = name || `Category ${i}`;
        }
        setCategoryNames(names);

        // Dispatch event to update sidebar and other components
        window.dispatchEvent(new Event('categoryNameUpdated'));
        
        // Dispatch specific event for category reorder to notify UpdateAudit
        window.dispatchEvent(new CustomEvent('categoriesReordered', {
          detail: {
            oldToNewMap: oldToNewMap,
            reorderedCategories: reorderedCategories,
          }
        }));
        
        // Update URL if user is viewing one of the moved categories
        const currentCategory = parseInt(new URLSearchParams(window.location.search).get('category') || '1', 10);
        const editId = searchParams.get('edit');
        
        // Find the new position of the currently viewed category
        const newCategoryPosition = oldToNewMap[currentCategory];
        
        if (newCategoryPosition && newCategoryPosition !== currentCategory) {
          // Navigate to the new category position to show the moved category
          const newUrl = `/update-audit?${editId ? `edit=${editId}&` : ''}category=${newCategoryPosition}`;
          router.push(newUrl);
        } else if (currentCategory === draggedCategoryIndex + 1 || currentCategory === finalTargetIndex + 1) {
          // If viewing one of the directly moved categories, reload to refresh
          window.location.reload();
        }
        // Otherwise, no action needed - data is updated and sidebar will refresh via event
      } catch (e) {
        console.error('Error reordering categories:', e);
        toast.error('Failed to reorder categories. Please try again.');
      }
    }

    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
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
      icon: ''
    },
    ...(isInvitedUser ? [] : [{
      name: 'ALL TEAM MEMBERS',
      href: '/invited-users',
      icon: ''
    }]),
  ];

  // When on add-new-audit, update-audit, summary, or test page, show Category 1-7 and hide ALL AUDITS button
  // On main page (pathname === '/'), only show ALL AUDITS
  const onNewAuditPage = pathname === '/add-new-audit';
  const onUpdateAuditPage = pathname === '/update-audit';
  const onSummaryPage = pathname === '/summary';
  const onTestPage = pathname === '/test';
  const onResultPage = pathname === '/test/result';
  const onMainPage = pathname === '/';

  // Calculate effectiveItems based on current page - always start fresh
  let effectiveItems: NavigationItem[] = [];
  
  // Only show categories and summary on specific audit pages, NOT on main page
  // Explicitly check that we're NOT on the main page first
  if (onMainPage) {
    // On main page, only show ALL AUDITS button
    effectiveItems = [...navigationItems];
  } else if (onNewAuditPage || onUpdateAuditPage || onSummaryPage || onTestPage) {
    const editId = searchParams.get('edit');
    const presentationId = searchParams.get('presentationId');
    // Determine the base path for categories - summary page should use update-audit if editId exists, otherwise add-new-audit
    let basePath = '/add-new-audit';
    if (onUpdateAuditPage) basePath = '/update-audit';
    if (onSummaryPage) {
      // On summary page, categories should link to update-audit if editId exists, otherwise add-new-audit
      basePath = editId ? '/update-audit' : '/add-new-audit';
    }
    if (onTestPage) basePath = '/test';
    
    // Determine how many categories to show
    // Only use actualCategoryCount for test/presentation page, always show 7 for create/update/summary pages
    const categoryCount = (onTestPage && presentationId)
      ? actualCategoryCount
      : 7; // Always show 7 for create, update, and summary pages
    
    // Create categories based on the count
    const categoryItems = Array.from({ length: categoryCount }, (_, i) => {
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

    // Add Summary as 8th item (category=8 or summary parameter)
    const summaryItem = (onNewAuditPage || onUpdateAuditPage) ? (() => {
      const summaryQuery = new URLSearchParams();
      if (onUpdateAuditPage && editId) summaryQuery.set('edit', editId);
      summaryQuery.set('category', '8');
      return {
        name: 'Summary',
        href: `${basePath}?${summaryQuery.toString()}`,
        icon: (
          <Image src={summary} alt="Summary" width={20} height={20} />
        ),
      };
    })() : null;

    // Build items array: categories + summary (no ALL AUDITS on create/update/test pages)
    // Don't show ALL AUDITS on create, update, or test/presentation pages
    effectiveItems = summaryItem 
      ? [...categoryItems, summaryItem]
      : [...categoryItems];
  } else {
    // For any other page (not main, not audit pages), just show navigation items (ALL AUDITS)
    effectiveItems = [...navigationItems];
  }

  return (
    <div 
      className="w-75 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative hide-scrollbar" 
      style={{ 
        width: '300px',
        overflowX: 'hidden',
        position: 'relative',
        backgroundColor: 'transparent'
      }}
    >
      {/* Logo/Brand or Summary Overview */}
      <div className="py-12 border-b-2 border-[#456987] flex justify-center" style={{ position: 'relative', zIndex: 2 }}>
        {onResultPage ? (
          <div className="flex items-center gap-3 px-4">
           
            <Image src={summary} alt="Logo" width={70} height={60} />
            <span className="text-white font-normal text-3xl">Summary Overview</span>
          </div>
        ) : (
          <Image 
            onClick={() => router.push('/')}
            className="cursor-pointer"
            src={user?.company?.logoUrl || logo} 
            alt="Logo" 
            width={168} 
            height={60} 
            style={{ 
              width: 'clamp(120px, 15vw, 168px)', 
              height: 'clamp(40px, 8vw, 60px)',
              objectFit: 'contain'
            }} 
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="pt-4 " style={{ position: 'relative', zIndex: 2, gap: 'clamp(0.75rem, 2.5vw, 1.25rem)', display: 'flex', flexDirection: 'column' }}>
        {onResultPage ? (
          <>
            {/* Area Of Urgent Focus */}
            <div className="px-4 mt-4">
              <h3 className="text-lg text-white mb-3 uppercase">Area Of Urgent Focus</h3>
              <div className="space-y-3">
                {testResultData && (() => {
                  const urgentCategories = [...testResultData.categoryScores]
                    .filter(cs => cs.categoryName.toLowerCase() !== 'summary')
                    .sort((a, b) => {
                      const aPercentage = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
                      const bPercentage = b.maxScore > 0 ? (b.score / b.maxScore) * 100 : 0;
                      return aPercentage - bPercentage;
                    })
                    .slice(0, 3);

                  return urgentCategories.map((cs) => {
                    const percentage = cs.maxScore > 0 ? (cs.score / cs.maxScore) * 100 : 0;
                    return (
                      <div key={cs.categoryId} className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white text-sm text-nowrap">{cs.categoryName}</span>
                        </div>
                        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#F65355] transition-all duration-500"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Testimonials */}
           
          </>
        ) : (
          <>
            {(onNewAuditPage || onUpdateAuditPage || onSummaryPage || onTestPage) && !onMainPage && (
              <div className="px-4 mb-3 text-center font-medium text-[#fffef7]">
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
          // For summary page, only the summary link should be active, not categories
          if (onSummaryPage) {
            if (item.name === 'Summary') {
              isActive = true;
            } else {
              // Categories on summary page should not be active
              isActive = false;
            }
          }
          // Use secondary styling for all items on create, update, and summary pages
          const useSecondary = onNewAuditPage || onUpdateAuditPage || onSummaryPage;
          // Test page: active = white bg, inactive = primary color with opacity + white text
          const isTestPageCategory = onTestPage && isCategoryItem;
          const isEditing = itemCategoryNumber !== null && editingCategory === itemCategoryNumber;
          // Check if this is a navigation item (ALL AUDITS, ALL TEAM MEMBERS)
          const isNavigationItem = !isCategoryItem && item.name !== 'Summary';
          
          // Determine background and text colors
          let backgroundColor = 'white';
          let textColor = primaryColor;
          
          if (useSecondary) {
            // Create/Update pages: use secondary styling
            backgroundColor =isActive ? "white": secondaryColor;
            textColor = isActive ? 'black' : 'white';
          } else if (isTestPageCategory) {
            // Test page: active = white, inactive = primary with opacity
            backgroundColor = isActive ? 'white' : secondaryColor;
            textColor = isActive ? 'black' : 'white';
          } else if (isNavigationItem && !isActive) {
            // Navigation items (ALL AUDITS, ALL TEAM MEMBERS) when inactive: match category button style
            // Use primary color with opacity background and white text (like category buttons on create/update pages)
            backgroundColor = secondaryColor;
            textColor = 'white';
          } else {
            // Default: white background
            backgroundColor = 'white';
            textColor = isActive ? 'black' : secondaryColor;
          }
          
          const isDragging = isCategoryItem && itemCategoryNumber !== null && draggedCategoryIndex === (itemCategoryNumber - 1);
          const isDragOver = isCategoryItem && itemCategoryNumber !== null && dragOverCategoryIndex === (itemCategoryNumber - 1);
          const canDrag = isCategoryItem && itemCategoryNumber !== null && pathname === '/update-audit' && item.name !== 'Summary';
          
          const isSummaryItem = item.name === 'Summary';
          
          return (
            <div
              key={item.name}
              draggable={canDrag && !isSummaryItem}
              onDragStart={(e) => {
                if (!canDrag || isSummaryItem) {
                  e.preventDefault();
                  return;
                }
                if (itemCategoryNumber === null || dragHandleCategory !== itemCategoryNumber) {
                  e.preventDefault();
                  return;
                }
                handleCategoryDragStart(e, itemCategoryNumber - 1);
              }}
              onDragEnd={() => setDragHandleCategory(null)}
              onDragOver={canDrag && !isSummaryItem ? (e) => handleCategoryDragOver(e, itemCategoryNumber! - 1) : undefined}
              onDragLeave={canDrag && !isSummaryItem ? handleCategoryDragLeave : undefined}
              onDrop={canDrag && !isSummaryItem ? (e) => handleCategoryDrop(e, itemCategoryNumber! - 1) : undefined}
              onClick={(e) => {
                // Allow clicking through to button for Summary items
                if (isSummaryItem) {
                  e.stopPropagation();
                }
              }}
              className={`ml-4 h-[40px]  flex items-center ${
                isActive 
                  ? 'w-[94.5%] mr-0 rounded-l-xl'  
                  : 'w-[88%] rounded-xl'
              } ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-2 border-dashed border-white' : ''} ${canDrag && !isSummaryItem ? 'cursor-move' : ''}`}
              style={{
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
                marginLeft: 'clamp(0.75rem, 2vw, 1rem)',
                backgroundColor: backgroundColor,
                color: textColor,
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
                  className="w-full bg-transparent border border-white/50 rounded px-4 py-1 outline-none"
                  style={{ color: 'inherit' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-between relative">
                  {canDrag && (
                    <div
                      className="w-4 h-4 mr-2 shrink-0 cursor-grab"
                      onMouseDown={() => {
                        if (itemCategoryNumber !== null) {
                          setDragHandleCategory(itemCategoryNumber);
                        }
                      }}
                      onMouseUp={() => setDragHandleCategory(null)}
                      onMouseLeave={() => setDragHandleCategory(null)}
                    >
                      <svg 
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ color: 'inherit', opacity: 0.6 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 h-full flex items-center gap-2">
                    {/* Category icon - clickable to open icon picker on create/update pages */}
                    {isCategoryItem && itemCategoryNumber !== null && (onNewAuditPage || onUpdateAuditPage) ? (
                      editingIconCategory === itemCategoryNumber ? (
                        // Show IconPicker dropdown directly (no button)
                        <div 
                          className="relative"
                          style={{ 
                            zIndex: 99999,
                            overflow: 'visible',
                            position: 'relative'
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <IconPicker
                            value={getCategoryIcon(itemCategoryNumber)}
                            onChange={(iconName) => {
                              handleCategoryIconUpdate(itemCategoryNumber, iconName);
                              setEditingIconCategory(null);
                            }}
                            placeholder="Select icon"
                            showButton={false}
                            isOpen={true}
                            onClose={() => setEditingIconCategory(null)}
                          />
                        </div>
                      ) : (
                        // Show clickable icon
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingIconCategory(itemCategoryNumber);
                          }}
                          className="cursor-pointer flex items-center justify-center hover:opacity-80 transition-opacity"
                          style={{ 
                            color: 'inherit',
                            minWidth: '20px',
                            minHeight: '20px'
                          }}
                          title="Click to change icon"
                        >
                          {getCategoryIcon(itemCategoryNumber) ? (
                            renderIcon(getCategoryIcon(itemCategoryNumber))
                          ) : (
                            item.icon
                          )}
                        </div>
                      )
                    ) : (
                      // Non-editable icon (on other pages)
                      <div className="flex items-center justify-center">
                        {isCategoryItem && itemCategoryNumber !== null && getCategoryIcon(itemCategoryNumber) ? (
                          renderIcon(getCategoryIcon(itemCategoryNumber))
                        ) : (
                          item.icon
                        )}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Allow navigation if:
                        // 1. Not editing category name
                        // 2. Either it's a category item (itemCategoryNumber !== null) and not editing icon, OR it's the Summary item, OR it's a non-category item (like ALL AUDITS)
                        const isSummaryItem = item.name === 'Summary';
                        const isNonCategoryItem = itemCategoryNumber === null && !isSummaryItem;
                        const canNavigate = !isEditing && (
                          isSummaryItem || 
                          isNonCategoryItem ||
                          (itemCategoryNumber !== null && editingIconCategory !== itemCategoryNumber)
                        );
                        if (canNavigate) {
                          console.log('Navigating to:', item.href);
                          router.push(item.href);
                        } else {
                          console.log('Navigation blocked:', { isEditing, isSummaryItem, itemCategoryNumber, editingIconCategory });
                        }
                      }}
                      className={`flex-1 h-full cursor-pointer flex items-center gap-2 text-left text-nowrap overflow-hidden text-ellipsis whitespace-nowrap ${isActive ? 'active-nav-item' : ''}`}
                      // style={{ color: 'inherit' }}
                    >
                      <span>{item.name}</span>
                    </button>
                  </div>
            {/* {isActive && <div>
            <div 
                className='absolute -right-5 -top-[26.6px] border-r-4 h-4 w-4 rounded rounded-r-full rotate-45 font-bold overflow-hidden'
                style={{ 
                  backgroundImage: 'url(/bg-img.png)',
                  backgroundSize: 'contain',
                  borderColor: (onNewAuditPage || onUpdateAuditPage || onSummaryPage) ? secondaryColor : 'white',
                }}
              >
                <div 
                  style={{ 
                    backgroundColor: primaryColorOverlay,
                    position: 'absolute',
                    inset: 0,
                  }}
                ></div>
              </div>
              <div 
                className='absolute -right-5 -bottom-[26.6px] border-r-4 h-4 w-4 rounded rounded-r-full -rotate-45 font-bold overflow-hidden'
                style={{ 
                  backgroundImage: 'url(/bg-img.png)',
                  backgroundSize: 'contain',
                  borderColor: (onNewAuditPage || onUpdateAuditPage || onSummaryPage) ? secondaryColor : 'white',
                }}
              >
                <div 
                  style={{ 
                    backgroundColor: primaryColorOverlay,
                    position: 'absolute',
                    inset: 0,
                  }}
                ></div>
              </div>
            </div>

            } */}
              
             {isCategoryItem && itemCategoryNumber !== null && (onNewAuditPage || onUpdateAuditPage) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(itemCategoryNumber);
                      }}
                      className="p-1 rounded hover:bg-white/20 cursor-pointer flex items-center"
                      style={{ color: 'inherit' }}
                      aria-label="Edit category name"
                    >
                      <FiEdit size={12} />
                    </button>
                    
                  )}
                </div>
              )}
            </div>
          );
        })}
          </>
        )}
      </nav>

      {/* User Profile Section or Action Buttons */}
      <div className="mt-auto overflow-hidden" style={{ position: 'relative', zIndex: 2, paddingBottom: 'clamp(1rem, 4vw, 2rem)' }}>
        {onResultPage ? (
         <div>
            <div className="px-4 mt-6">
           <h3 className="text-lg text-white mb-3 uppercase text-center">Testimonials</h3>
           <div className="space-y-4">
             <div className="bg-white/10 rounded-lg p-3  text-center">
               <p className="text-white text-xs leading-relaxed ">
                 This audit system has transformed how we track and improve our processes. The comprehensive scoring and detailed recommendations help us identify areas for urgent attention.
               </p>
             </div>
             <div className="bg-white/10 rounded-lg p-3  text-center">
               <p className="text-white text-xs leading-relaxed ">
                 The category-based assessment structure makes it easy to focus on specific areas. The summary overview provides clear insights for continuous improvement.
               </p>
             </div>
           </div>
         </div>
          <div className="px-4 space-y-3 grid grid-cols-2 gap-4 mt-10">
            <CustomButton
              onClick={handleLogout}
              className="w-full py-1 rounded-full font-semibold text-white transition-colors text-center"
           
            >
              Logout
            </CustomButton>
          
            <button
              onClick={() => router.push('/')}
              className="w-full py-1 h-10 cursor-pointer rounded-full bg-transparent border border-white/50  font-semibold text-white transition-colors text-center"
          
            >
              Exit
            </button>
          </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center" style={{ marginBottom: 'clamp(0.75rem, 3vw, 1.25rem)' }}>
              {user.profileImageUrl ? (
                <Image
                  className="rounded-lg w-[180px]  h-[199px] object-cover cursor-pointer"
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
          </>
        )}
      </div>
    </div>
  );
}
