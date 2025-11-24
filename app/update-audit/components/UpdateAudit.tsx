"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auditApi } from "@/lib/api";
import { useUpdateAudit } from "@/lib/hooks/useAudit";
import { Presentation } from "@/lib/types";
import toast from "react-hot-toast";
import TableSkeleton from "../../add-new-audit/components/tableSkeleton";
import { CustomButton } from "@/components/common";
import { FiEdit } from "react-icons/fi";
import SummarySection from "@/components/SummarySection";

type OptionState = { id?: string; text: string; points: number };
type CategoryFormData = {
  id?: string;
  name: string;
  icon?: string;
  recommendation?: string;
  questions: Array<{
    id?: string;
    text: string;
    options: OptionState[];
  }>;
};

type FormData = {
  title: string;
  categories: CategoryFormData[];
  summary?: {
    categoryRecommendations?: Array<{ categoryId: string; recommendation: string }>;
    nextSteps?: Array<{ type: 'file' | 'text'; content: string; fileUrl?: string }>;
    overallDetails?: string;
  };
};

export default function UpdateAudit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = parseInt(searchParams.get('category') || '1', 10);
  const editId = searchParams.get('edit');
  
  const updateAuditMutation = useUpdateAudit();
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    categories: [],
    summary: undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [titleEditable, setTitleEditable] = useState(false);
  const [sessionStorageCategories, setSessionStorageCategories] = useState<Array<{ id: string; name: string; recommendation?: string }>>([]);
  
  // Sync formData.summary with sessionStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSummaryUpdate = () => {
      const summaryDataStr = sessionStorage.getItem('summaryData');
      if (summaryDataStr) {
        try {
          const parsed = JSON.parse(summaryDataStr);
          setFormData(prev => ({
            ...prev,
            summary: {
              categoryRecommendations: parsed.categoryRecommendations || [],
              nextSteps: parsed.nextSteps || [],
              overallDetails: parsed.overallDetails || undefined,
            },
          }));
        } catch (error) {
          console.error('Error syncing summary from sessionStorage:', error);
        }
      }
    };

    // Listen for custom event when summary is updated
    window.addEventListener('summaryDataUpdated', handleSummaryUpdate);
    
    // Also listen for storage events (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'summaryData') {
        handleSummaryUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('summaryDataUpdated', handleSummaryUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync formData category names/icons when updated in Sidebar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCategoryNameUpdate = () => {
      // Update formData category names from sessionStorage
      setFormData(prev => {
        const updatedCategories = prev.categories.map((cat, idx) => {
          const categoryNumber = idx + 1;
          const categoryName = sessionStorage.getItem(`auditData:categoryName:${categoryNumber}`);
          const categoryIcon = sessionStorage.getItem(`auditData:categoryIcon:${categoryNumber}`);
          
          return {
            ...cat,
            name: categoryName || cat.name,
            icon: categoryIcon || (categoryIcon === null ? undefined : cat.icon),
          };
        });
        
        return {
          ...prev,
          categories: updatedCategories,
        };
      });
    };

    // Listen for category name updates from Sidebar
    window.addEventListener('categoryNameUpdated', handleCategoryNameUpdate);
    
    // Also listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('auditData:categoryName:') || e.key?.startsWith('auditData:categoryIcon:')) {
        handleCategoryNameUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('categoryNameUpdated', handleCategoryNameUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync formData.categories when categories are reordered in Sidebar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCategoryReorder = (event?: CustomEvent) => {
      try {
        let newCategoriesForStorage: CategoryFormData[] | null = null;
        let newSummaryForStorage: FormData['summary'] | null = null;

        setFormData(prev => {
          // Only proceed if we have existing categories
          if (!prev.categories || prev.categories.length === 0) {
            return prev;
          }

          // Only reorder when we have the mapping (drag-and-drop event)
          if (event?.detail?.oldToNewMap) {
            const oldToNewMap = event.detail.oldToNewMap as Record<number, number>;
            const categoryCount = Math.max(7, prev.categories.length);
            const newCategories: CategoryFormData[] = new Array(categoryCount);

            // Create reverse mapping (new position -> old position)
            const newToOldMap: Record<number, number> = {};
            Object.keys(oldToNewMap).forEach(oldPosStr => {
              const oldPos = Number(oldPosStr);
              const newPos = oldToNewMap[oldPos];
              if (newPos) {
                newToOldMap[newPos] = oldPos;
              }
            });

            for (let newPos = 1; newPos <= categoryCount; newPos++) {
              const oldPos = newToOldMap[newPos] ?? newPos;
              const oldIndex = oldPos - 1;

              if (oldIndex >= 0 && oldIndex < prev.categories.length) {
                newCategories[newPos - 1] = { ...prev.categories[oldIndex] };
              } else if (newPos - 1 < prev.categories.length) {
                // Fallback to current position if mapping missing
                newCategories[newPos - 1] = { ...prev.categories[newPos - 1] };
              } else {
                newCategories[newPos - 1] = {
                  name: `Category ${newPos}`,
                  questions: [],
                };
              }
            }

            // Update category names/icons from sessionStorage
            for (let i = 0; i < Math.min(newCategories.length, 7); i++) {
              const categoryNumber = i + 1;
              const categoryName = sessionStorage.getItem(`auditData:categoryName:${categoryNumber}`);
              const categoryIcon = sessionStorage.getItem(`auditData:categoryIcon:${categoryNumber}`);

              if (categoryName) {
                newCategories[i].name = categoryName;
              }
              if (categoryIcon) {
                newCategories[i].icon = categoryIcon;
              } else if (categoryIcon === null) {
                newCategories[i].icon = undefined;
              }
            }

            // Reorder summary recommendations to match the new category order
            let updatedSummary = prev.summary;
            if (prev.summary && prev.summary.categoryRecommendations) {
              const oldRecommendations = prev.summary.categoryRecommendations;
              const reorderedRecommendations: Array<{ categoryId: string; recommendation: string }> = new Array(
                newCategories.length
              );

              for (let oldPos = 1; oldPos <= oldRecommendations.length; oldPos++) {
                const entry = oldRecommendations[oldPos - 1];
                if (!entry) continue;

                const newPos = oldToNewMap[oldPos] ?? oldPos;
                const newCategoryId = newCategories[newPos - 1]?.id || entry.categoryId || '';

                reorderedRecommendations[newPos - 1] = {
                  categoryId: newCategoryId,
                  recommendation: entry.recommendation || '',
                };
              }

              // Fill any gaps
              for (let i = 0; i < newCategories.length; i++) {
                if (!reorderedRecommendations[i]) {
                  reorderedRecommendations[i] = {
                    categoryId: newCategories[i]?.id || '',
                    recommendation: '',
                  };
                }
              }

              updatedSummary = {
                ...prev.summary,
                categoryRecommendations: reorderedRecommendations,
              };
            }

            newCategoriesForStorage = newCategories;
            newSummaryForStorage = updatedSummary || null;

            return {
              ...prev,
              categories: newCategories,
              summary: updatedSummary,
            };
          }

          // If no mapping provided, don't update categories from sessionStorage
          // This prevents overwriting formData when categoryNameUpdated event fires
          // Only update during actual reorder events
          return prev;
        });

        // Update derived state outside of setFormData using captured values
        const categoriesForStorage = newCategoriesForStorage as CategoryFormData[] | null;
        if (categoriesForStorage && Array.isArray(categoriesForStorage)) {
          setSessionStorageCategories(
            categoriesForStorage.map((cat: CategoryFormData, idx: number) => ({
              id: cat.id || `temp-${idx}`,
              name: cat.name,
              recommendation: cat.recommendation || "",
            }))
          );
        }

        const summaryForStorage = newSummaryForStorage as FormData['summary'] | null;
        if (summaryForStorage) {
          try {
            const summaryDataToSave = {
              categoryRecommendations: summaryForStorage?.categoryRecommendations || [],
              nextSteps: summaryForStorage?.nextSteps || [],
              overallDetails: summaryForStorage?.overallDetails || undefined,
            };
            sessionStorage.setItem('summaryData', JSON.stringify(summaryDataToSave));
            window.dispatchEvent(new Event('summaryDataUpdated'));
          } catch (error) {
            console.error('Error updating sessionStorage summary:', error);
          }
        }
      } catch (error) {
        console.error('Error syncing categories after reorder:', error);
      }
    };

    // Listen for category reorder custom event
    const handleCustomReorder = (event: Event) => {
      handleCategoryReorder(event as CustomEvent);
    };
    window.addEventListener('categoriesReordered', handleCustomReorder);

    return () => {
      window.removeEventListener('categoriesReordered', handleCustomReorder);
    };
  }, []);

  // Fetch audit data from API and populate form data
  useEffect(() => {
    if (!editId) {
      toast.error("Audit ID is missing");
      setLoading(false);
      router.push("/");
      return;
    }

    const fetchAuditData = async () => {
      try {
        setLoading(true);
        const audit = await auditApi.getById(editId);
        
        // Transform audit data to form data structure
        const categories: CategoryFormData[] = audit.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
          icon: cat.icon || undefined,
              questions: cat.questions.map(q => ({
                id: q.id,
                text: q.text,
                options: q.options.map(opt => ({
                  id: opt.id,
                  text: opt.text,
                  points: opt.points
                }))
              }))
            }));
            
        // Handle summary data
        const auditWithSummary = audit as Presentation & { 
          summary?: { 
            categoryRecommendations?: string | Array<{ categoryId: string; recommendation: string }>; 
            nextSteps?: string | Array<{ type: string; content: string; fileUrl?: string }>; 
            overallDetails?: string | null 
          } | null 
        };

        let summaryData = undefined;
            if (auditWithSummary.summary) {
              const summary = auditWithSummary.summary;
              let categoryRecommendations = summary.categoryRecommendations 
                ? (typeof summary.categoryRecommendations === 'string' 
                    ? JSON.parse(summary.categoryRecommendations) 
                    : summary.categoryRecommendations)
                : [];
              
              // Map temp IDs to real category IDs if needed
              if (Array.isArray(categoryRecommendations)) {
                categoryRecommendations = categoryRecommendations.map((rec: { categoryId: string; recommendation: string }, index: number) => {
                  if (rec.categoryId && rec.categoryId.startsWith('temp-')) {
                    const tempIndex = parseInt(rec.categoryId.replace('temp-', ''), 10);
                    if (!isNaN(tempIndex) && audit.categories[tempIndex]) {
                      return {
                        categoryId: audit.categories[tempIndex].id,
                        recommendation: rec.recommendation || "",
                      };
                    }
                  }
                  const categoryExists = audit.categories.some(cat => cat.id === rec.categoryId);
                  if (categoryExists) {
                    return rec;
                  }
                  if (audit.categories[index]) {
                    return {
                      categoryId: audit.categories[index].id,
                      recommendation: rec.recommendation || "",
                    };
                  }
                  return rec;
                });
              }
              
          // Ensure all categories have entries
              const allCategoryRecommendations = audit.categories.map((cat) => {
                const existing = Array.isArray(categoryRecommendations) 
                  ? categoryRecommendations.find((rec: { categoryId: string }) => rec.categoryId === cat.id)
                  : null;
                return existing || {
                  categoryId: cat.id,
                  recommendation: "",
                };
              });
              
          summaryData = {
                categoryRecommendations: allCategoryRecommendations,
                nextSteps: summary.nextSteps
                  ? (typeof summary.nextSteps === 'string'
                      ? JSON.parse(summary.nextSteps)
                      : summary.nextSteps)
                  : [],
                overallDetails: summary.overallDetails || undefined,
              };
            } else {
          summaryData = {
                categoryRecommendations: audit.categories.map((cat) => ({
                  categoryId: cat.id,
                  recommendation: "",
                })),
                nextSteps: [],
                overallDetails: "",
              };
        }

        const recommendationMap = new Map<string, string>();
        if (summaryData?.categoryRecommendations) {
          summaryData.categoryRecommendations.forEach(
            (rec: { categoryId: string; recommendation: string }, index: number) => {
              if (rec?.categoryId) {
                recommendationMap.set(rec.categoryId, rec.recommendation || "");
              } else {
                recommendationMap.set(`position-${index}`, rec.recommendation || "");
              }
            }
          );
        }

        const categoriesWithRecommendations = categories.map((cat, index) => ({
          ...cat,
          recommendation:
            recommendationMap.get(cat.id || "") ??
            recommendationMap.get(`position-${index}`) ??
            "",
        }));

        // Set form data
        setFormData({
          title: audit.title,
          categories: categoriesWithRecommendations,
          summary: summaryData,
        });

        // Update sessionStorageCategories for SummarySection
        setSessionStorageCategories(categoriesWithRecommendations.map((cat, idx) => ({
          id: cat.id || `temp-${idx}`,
          name: cat.name,
          recommendation: cat.recommendation || "",
        })));

        // Store summary data in sessionStorage for SummarySection component
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('summaryData', JSON.stringify(summaryData));
          // Store category names for sidebar
          categoriesWithRecommendations.forEach((cat, index) => {
            const categoryNumber = index + 1;
            sessionStorage.setItem(`auditData:categoryName:${categoryNumber}`, cat.name);
            if (cat.icon) {
              sessionStorage.setItem(`auditData:categoryIcon:${categoryNumber}`, cat.icon);
            } else {
              sessionStorage.removeItem(`auditData:categoryIcon:${categoryNumber}`);
            }
            if (cat.recommendation !== undefined) {
              sessionStorage.setItem(
                `auditData:categoryRecommendation:${categoryNumber}`,
                cat.recommendation
              );
            }
          });
          window.dispatchEvent(new Event('categoryNameUpdated'));
        }
      } catch (error) {
        console.error("Error fetching audit data:", error);
        toast.error("Failed to load audit data. Please try again.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [editId, router]);

  // Get current category data
  const currentCategoryData = formData.categories[currentCategory - 1] || {
    name: `Category ${currentCategory}`,
    icon: undefined,
    questions: [],
  };

  // Update category name
  const updateCategoryName = (name: string) => {
    const finalName = name || `Category ${currentCategory}`;
    
    setFormData(prev => {
      const newCategories = [...prev.categories];
      const categoryIndex = currentCategory - 1;
      
      // Ensure array is long enough
      while (newCategories.length <= categoryIndex) {
        newCategories.push({
          name: `Category ${newCategories.length + 1}`,
          questions: [],
        });
      }
      
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        name: finalName,
      };
      
      return {
        ...prev,
        categories: newCategories,
      };
    });
    
    // Update sessionStorage for sidebar
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`auditData:categoryName:${currentCategory}`, finalName);
      
      // Also update auditData categories array in sessionStorage
      try {
        const raw = sessionStorage.getItem('auditData');
        const data = raw ? JSON.parse(raw) : { categories: [] };
        if (!Array.isArray(data.categories)) data.categories = [];
        
        const idx = currentCategory - 1;
        while (data.categories.length < currentCategory) {
          data.categories.push({ name: `Category ${data.categories.length + 1}`, questions: [] });
        }
        
        if (data.categories[idx]) {
          data.categories[idx].name = finalName;
        } else {
          data.categories[idx] = { name: finalName, questions: [] };
        }
        
        sessionStorage.setItem('auditData', JSON.stringify(data));
      } catch (e) {
        console.error('Error updating auditData category name:', e);
      }
      
      // Update sessionStorageCategories for SummarySection
      setSessionStorageCategories(prev => {
        const updated = [...prev];
        const categoryIndex = currentCategory - 1;
        const wasNewCategory = updated.length <= categoryIndex;
        
        // Ensure array is long enough
        while (updated.length <= categoryIndex) {
          const catNum = updated.length + 1;
          // Try to get ID from formData if available
          const formDataCategory = formData.categories[updated.length];
          updated.push({
            id: formDataCategory?.id || `temp-${updated.length}`,
            name: `Category ${catNum}`,
            recommendation: formDataCategory?.recommendation || "",
          });
        }
        // Update the category name
        updated[categoryIndex] = {
          ...updated[categoryIndex],
          name: finalName,
        };
        
        // If this was a new category, dispatch event to notify SummarySection
        if (wasNewCategory && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('categoryNameUpdated'));
        }
        
        return updated;
      });
      
      // Dispatch event to notify Sidebar
      window.dispatchEvent(new Event('categoryNameUpdated'));
    }
  };

  // Update category icon
  const updateCategoryIcon = (icon: string) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      const categoryIndex = currentCategory - 1;
      
      // Ensure array is long enough
      while (newCategories.length <= categoryIndex) {
        newCategories.push({
          name: `Category ${newCategories.length + 1}`,
          questions: [],
        });
      }
      
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        icon: icon || undefined,
      };
      
      return {
        ...prev,
        categories: newCategories,
      };
    });
    
    // Update sessionStorage for sidebar
    if (typeof window !== 'undefined') {
      if (icon) {
        sessionStorage.setItem(`auditData:categoryIcon:${currentCategory}`, icon);
          } else {
        sessionStorage.removeItem(`auditData:categoryIcon:${currentCategory}`);
      }
      window.dispatchEvent(new Event('categoryNameUpdated'));
    }
  };

  // Update question text
  const updateQuestion = (rowIndex: number, text: string) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      const categoryIndex = currentCategory - 1;
      const wasNewCategory = newCategories.length <= categoryIndex;
      
      // Ensure array is long enough
      while (newCategories.length <= categoryIndex) {
        newCategories.push({
          name: `Category ${newCategories.length + 1}`,
          questions: [],
        });
      }
      
      const category = { ...newCategories[categoryIndex] };
      const questions = [...category.questions];
      
      // Ensure questions array is long enough
      while (questions.length < rowIndex) {
        questions.push({
          text: "",
          options: [],
        });
      }
      
      if (questions[rowIndex - 1]) {
        questions[rowIndex - 1] = {
          ...questions[rowIndex - 1],
          text: text,
        };
      } else {
        questions[rowIndex - 1] = {
          text: text,
          options: ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"].map((label, i) => ({
            text: label,
            points: i + 1,
          })),
        };
      }
      
      category.questions = questions;
      newCategories[categoryIndex] = category;
      
      // If this is a new category with questions, update sessionStorageCategories
      if (wasNewCategory && text.trim().length > 0 && typeof window !== 'undefined') {
        // Update sessionStorageCategories to include the new category
        setSessionStorageCategories(prev => {
          const updated = [...prev];
          while (updated.length <= categoryIndex) {
            const catNum = updated.length + 1;
            const storedName = sessionStorage.getItem(`auditData:categoryName:${catNum}`);
            updated.push({
              id: `temp-${updated.length}`,
              name: storedName || `Category ${catNum}`,
              recommendation: sessionStorage.getItem(`auditData:categoryRecommendation:${catNum}`) || "",
            });
          }
          // Update the name from sessionStorage if available
          const storedName = sessionStorage.getItem(`auditData:categoryName:${currentCategory}`);
          if (storedName) {
            updated[categoryIndex].name = storedName;
          } else {
            updated[categoryIndex].name = category.name;
          }
          return updated;
        });
        
        // Store category name in sessionStorage if not already stored
        const storedName = sessionStorage.getItem(`auditData:categoryName:${currentCategory}`);
        if (!storedName) {
          sessionStorage.setItem(`auditData:categoryName:${currentCategory}`, category.name);
        }
        
        // Dispatch event to notify SummarySection
        window.dispatchEvent(new Event('categoryNameUpdated'));
      }
      
      return {
        ...prev,
        categories: newCategories,
      };
    });
  };

  // Update option text
  const updateOption = (rowIndex: number, optionIndex: number, text: string) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      const categoryIndex = currentCategory - 1;
      
      // Ensure array is long enough
      while (newCategories.length <= categoryIndex) {
        newCategories.push({
          name: `Category ${newCategories.length + 1}`,
          questions: [],
        });
      }
      
      const category = { ...newCategories[categoryIndex] };
      const questions = [...category.questions];
      
      // Ensure questions array is long enough
      while (questions.length < rowIndex) {
        questions.push({
          text: "",
          options: ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"].map((label, i) => ({
            text: label,
            points: i + 1,
          })),
        });
      }
      
      if (questions[rowIndex - 1]) {
        const question = { ...questions[rowIndex - 1] };
        const options = [...question.options];
        
        // Ensure options array has 5 items
        while (options.length < 5) {
          options.push({
            text: ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"][options.length] || "",
            points: options.length + 1,
          });
        }
        
        options[optionIndex] = {
          ...options[optionIndex],
          text: text,
        };
        
        question.options = options;
        questions[rowIndex - 1] = question;
      } else {
        const defaultOptions = ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"].map((label, i) => ({
          text: label,
          points: i + 1,
        }));
        defaultOptions[optionIndex] = {
          text: text,
          points: optionIndex + 1,
        };
        questions[rowIndex - 1] = {
          text: "",
          options: defaultOptions,
        };
      }
      
      category.questions = questions;
      newCategories[categoryIndex] = category;
      
      return {
        ...prev,
        categories: newCategories,
      };
    });
  };

  // Reorder questions
  const reorderQuestions = (draggedRowIndex: number, targetRowIndex: number) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      const categoryIndex = currentCategory - 1;
      
      if (categoryIndex < 0 || categoryIndex >= newCategories.length) return prev;
      
      const category = { ...newCategories[categoryIndex] };
      const questions = [...category.questions];
      
      if (draggedRowIndex < 1 || draggedRowIndex > questions.length || 
          targetRowIndex < 1 || targetRowIndex > questions.length) {
        return prev;
      }
      
      // Reorder questions
      const draggedQuestion = questions[draggedRowIndex - 1];
      questions.splice(draggedRowIndex - 1, 1);
      questions.splice(targetRowIndex - 1, 0, draggedQuestion);
      
      category.questions = questions;
      newCategories[categoryIndex] = category;
      
      return {
        ...prev,
        categories: newCategories,
      };
    });
  };

  const handleCategoryRecommendationChange = React.useCallback(
    (categoryId: string, value: string, categoryIndex: number) => {
      setFormData((prev) => {
        const newCategories = [...prev.categories];
        let targetIndex = newCategories.findIndex((cat, idx) =>
          cat.id ? cat.id === categoryId : idx === categoryIndex - 1
        );
        if (targetIndex === -1 && categoryIndex >= 1) {
          targetIndex = Math.min(categoryIndex - 1, newCategories.length - 1);
        }
        if (targetIndex >= 0 && targetIndex < newCategories.length) {
          newCategories[targetIndex] = {
            ...newCategories[targetIndex],
            recommendation: value,
          };
          return {
            ...prev,
            categories: newCategories,
          };
        }
        return prev;
      });

      setSessionStorageCategories((prev) => {
        const next = [...prev];
        let targetIndex = next.findIndex((cat, idx) =>
          cat.id ? cat.id === categoryId : idx === categoryIndex - 1
        );
        if (targetIndex === -1 && categoryIndex >= 1) {
          targetIndex = categoryIndex - 1;
        }
        while (targetIndex >= next.length && next.length < 7) {
          next.push({
            id: `temp-${next.length}`,
            name: `Category ${next.length + 1}`,
            recommendation: "",
          });
        }
        if (targetIndex >= 0 && targetIndex < next.length) {
          next[targetIndex] = {
            ...next[targetIndex],
            recommendation: value,
          };
        }
        return next;
      });
    },
    []
  );

  const handleUpdate = async () => {
    if (!editId) {
      toast.error("Audit ID is missing");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Presentation name is required");
      return;
    }

    // Validate that at least one category has questions
    const hasQuestions = formData.categories.some(cat => 
      cat.questions.some(q => q.text && q.text.trim().length > 0)
    );

    if (!hasQuestions) {
      toast.error("Add at least one question in the table");
      return;
      }

      setSubmitting(true);

    try {
      const recommendationEntries = formData.categories
        .slice(0, 7)
        .map((cat, idx) => ({
          categoryId: cat.id || `temp-${idx}`,
          recommendation: cat.recommendation || "",
        }));

      // Get latest category names from sessionStorage (source of truth)
      // This ensures names updated in Sidebar are included in the payload
      const latestCategoryNames: Record<number, string> = {};
      const latestCategoryIcons: Record<number, string | undefined> = {};
      
      if (typeof window !== 'undefined') {
        for (let i = 1; i <= 7; i++) {
          const name = sessionStorage.getItem(`auditData:categoryName:${i}`);
          const icon = sessionStorage.getItem(`auditData:categoryIcon:${i}`);
          if (name) {
            latestCategoryNames[i] = name;
          }
          if (icon) {
            latestCategoryIcons[i] = icon;
          } else {
            latestCategoryIcons[i] = undefined;
          }
        }
      }
      
      // Transform form data to API format
      const categories = formData.categories
        .filter((cat, index) => index < 7) // Only categories 1-7
        .map((cat, index) => {
          const categoryNumber = index + 1;
          // Use latest name from sessionStorage if available, otherwise use formData name
          const categoryName = latestCategoryNames[categoryNumber] || cat.name || `Category ${categoryNumber}`;
          // Use latest icon from sessionStorage if available, otherwise use formData icon
          const categoryIcon = latestCategoryIcons[categoryNumber] !== undefined 
            ? latestCategoryIcons[categoryNumber] 
            : ((cat.icon && cat.icon.trim()) ? cat.icon.trim() : undefined);
          
          const questions = cat.questions
            .filter(q => q.text && q.text.trim().length > 0)
            .map(q => ({
              id: q.id, // Include question ID if it exists
              text: q.text.trim(),
              options: (Array.isArray(q.options) && q.options.length === 5)
                ? q.options.map((opt) => ({
                    id: opt.id, // Include option ID if it exists
                    text: opt.text.trim(),
                    points: opt.points
                  }))
                : ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"].map((text, i) => ({
                    text: text,
                    points: i + 1
                  }))
            }))
            .filter(q => q.text.length > 0);

          return {
            id: cat.id, // Include category ID if it exists
            name: categoryName,
            icon: categoryIcon,
            questions
          };
        })
        .filter(cat => cat.questions.length > 0);

      if (categories.length === 0) {
        toast.error("Add at least one question in the table");
        setSubmitting(false);
        return;
      }

      // Get summary data from sessionStorage (priority) or form data (fallback)
      const summaryData: {
        categoryRecommendations: Array<{ categoryId: string; recommendation: string }>;
        nextSteps: Array<{ type: 'file' | 'text'; content: string; fileUrl?: string }>;
        overallDetails?: string;
      } = {
        categoryRecommendations: recommendationEntries,
        nextSteps: [],
        overallDetails: undefined,
      };

      type SummarySource = {
        nextSteps?: Array<{ type?: string; content?: string; fileUrl?: string }>;
        overallDetails?: string | null;
      };

      const hydrateNextSteps = (source?: SummarySource | null) => {
        if (!source) return;
        if (Array.isArray(source.nextSteps)) {
          summaryData.nextSteps = source.nextSteps.map((step) => ({
            type: (step.type === 'file' || step.type === 'text') ? step.type : 'text',
            content: step.content || '',
            fileUrl: step.fileUrl,
          }));
        }
        if (source.overallDetails !== undefined) {
          summaryData.overallDetails = source.overallDetails || undefined;
        }
      };

      if (typeof window !== 'undefined') {
        const summaryDataStr = sessionStorage.getItem('summaryData');
        if (summaryDataStr) {
          try {
            const parsed = JSON.parse(summaryDataStr);
            hydrateNextSteps(parsed);
          } catch (error) {
            console.error('Error parsing summaryData from sessionStorage:', error);
            if (formData.summary) {
              hydrateNextSteps(formData.summary);
            }
          }
        } else if (formData.summary) {
          hydrateNextSteps(formData.summary);
        }
      } else if (formData.summary) {
        hydrateNextSteps(formData.summary);
      }

      // Call update audit API using mutation hook (this will automatically invalidate cache)
      await updateAuditMutation.mutateAsync({
        id: editId,
        data: {
          title: formData.title.trim(),
          categories,
          summary: summaryData,
        },
      });

      toast.success("Audit updated successfully");
      
      // Clear form data
      setFormData({
        title: "",
        categories: [],
        summary: undefined,
      });
      
      // Clear sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        window.dispatchEvent(new Event('categoryNameUpdated'));
      }
      
      // Redirect to home page
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (e) {
      toast.error("Failed to update audit. Please try again.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="">
      <header className="">
        <div className="bg-white pt-5 flex items-center justify-center gap-2.5 w-full ">
          <p className="text-[17px] uppercase font-500 tracking-[0.352px] leading-normal font-medium">GRADING SCALE (1-5)</p>
          <div className="grid grid-cols-3 gap-[1.89px]">
            <p className="w-full text-[17px] uppercase font-medium bg-[#F65355] px-[38px] py-2.5 text-white rounded-tl-xl">
              1-2 URGENT ATTEN
            </p>
            <p className="w-full text-[17px] uppercase font-medium bg-[#F7AF41] px-[38px] py-2.5 text-white ">
              3-4 AVERAGE AUDIT
            </p>
            <p className="w-full text-[17px] uppercase font-medium bg-[#209150] px-[38px] py-2.5 text-white rounded-tr-xl">
              5 EXELLENT AUDIT
            </p>
          </div>
        </div>
     
          <div className="px-24 flex items-center justify-between">
            {["questions", "answers", "score"].map((item,i) => (
              <p key={i} className={`text-[22px] text-white capitalize font-500 tracking-[0.352px] leading-normal font-medium ${i === 1 ? "ml-56":""}`}>
                {item}
              </p>
            ))}
          </div>
      </header>
      <main className="px-24 pt-5 bg-white h-full pb-10">
        <div className="flex gap items-center justify-between mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Presentation Name"
              disabled={!titleEditable}
              className="w-full bg-[#4569871A]  text-[18px] pr-12 pl-6 py-[12px] border border-[#3b5163] rounded-xl outline-none disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => setTitleEditable((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-700 hover:bg-gray-50 rounded cursor-pointer"
              aria-label={titleEditable ? "Disable editing title" : "Enable editing title"}
            >
              <FiEdit size={12} />
            </button>
          </div>
          <div className="w-px h-0 bg-[#3b5163] mx-7"></div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-[20px] py-[12px] bg-[#CECECE] hover:bg-[#CECECE]/80 transition-all duration-300 rounded-full text-[18px] tracking-[0.352px] leading-normal cursor-pointer"
            >
              Back to List
            </button>
            <CustomButton
              variant="primary"
              size="md"
              className="flex-1"
              fullRounded={true}
              disabled={submitting || updateAuditMutation.isPending}
              onClick={handleUpdate}
            >
              {submitting ? "Saving..." : "Save Audit"}
            </CustomButton>
          </div>
        </div>

        {currentCategory === 8 ? (
          <SummarySection
            editId={editId}
            isCreateMode={false}
            sessionStorageCategories={sessionStorageCategories}
            onRecommendationChange={handleCategoryRecommendationChange}
          />
        ) : (
          <div className="mt-8">
            <AuditTable
              currentCategory={currentCategory}
              categoryData={currentCategoryData}
              onCategoryNameChange={updateCategoryName}
              onCategoryIconChange={updateCategoryIcon}
              onQuestionChange={updateQuestion}
              onOptionChange={updateOption}
              onQuestionsReorder={reorderQuestions}
            />
          </div>
        )}
      </main>
    </div>
  );
}

interface AuditTableProps {
  currentCategory: number;
  categoryData: CategoryFormData;
  onCategoryNameChange: (name: string) => void;
  onCategoryIconChange: (icon: string) => void;
  onQuestionChange: (rowIndex: number, text: string) => void;
  onOptionChange: (rowIndex: number, optionIndex: number, text: string) => void;
  onQuestionsReorder: (draggedRowIndex: number, targetRowIndex: number) => void;
}

function AuditTable({ 
  currentCategory, 
  categoryData, 
  onQuestionChange, 
  onOptionChange,
  onQuestionsReorder,
}: AuditTableProps) {
  const [activeRows, setActiveRows] = useState<Set<number>>(new Set());
  const [editableQuestions, setEditableQuestions] = useState<Set<number>>(new Set());
  const [editableStatus, setEditableStatus] = useState<Record<number, Set<number>>>({});
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  // Initialize active rows based on category data
  useEffect(() => {
    const rowsToActivate = new Set<number>();
    categoryData.questions.forEach((q, idx) => {
              const rowIndex = idx + 1;
      if (q.text && q.text.trim().length > 0) {
        rowsToActivate.add(rowIndex);
      }
    });
      setActiveRows(rowsToActivate);
  }, [categoryData, currentCategory]);

  const handleQuestionClick = (rowIndex: number) => {
    setActiveRows(prev => {
      const newSet = new Set(prev);
      newSet.add(rowIndex);
      return newSet;
    });
  };

  const getQuestionText = (rowIndex: number): string => {
    const question = categoryData.questions[rowIndex - 1];
    return question?.text || '';
  };

  const getOptionText = (rowIndex: number, optionIndex: number): string => {
    const question = categoryData.questions[rowIndex - 1];
    if (question && question.options && question.options[optionIndex]) {
      return question.options[optionIndex].text;
    }
    return statusButtons[optionIndex].label;
  };

  const handleQuestionChange = (rowIndex: number, value: string) => {
    onQuestionChange(rowIndex, value);
    
    // Auto-add options if question has content and options don't exist
    const question = categoryData.questions[rowIndex - 1];
    if (value.trim().length > 0 && (!question || !question.options || question.options.length === 0)) {
      // Options will be added automatically in updateQuestion function
    }
  };

  const handleOptionChange = (rowIndex: number, optionIndex: number, value: string) => {
    onOptionChange(rowIndex, optionIndex, value);
  };

  const statusButtons = [
    { label: "Very Minimal", color: "bg-[#FFE2E380]", borderColor: "border-[#FFB7B9]", textColor: "text-pink-800" },
    { label: "Just Starting", color: "bg-[#FFFCE280]", borderColor: "border-[#E3D668]", textColor: "text-yellow-800" },
    { label: "Good progress", color: "bg-[#FFDBC2B2]", borderColor: "border-[#894B00E5]", textColor: "text-orange-800" },
    { label: "Excellent", color: "bg-[#DCFCE7]", borderColor: "border-[#01673099]", textColor: "text-green-800" },
    { label: "Very Excellent", color: "bg-[#DCF3F6]", borderColor: "border-[#01673099]", textColor: "text-blue-800" },
  ];

  // Handle question row drag and drop
  const handleRowDragStart = (e: React.DragEvent, rowIndex: number) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('input') || target.closest('button')) {
      e.preventDefault();
      return;
    }
    setDraggedRowIndex(rowIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', rowIndex.toString());
  };

  const handleRowDragOver = (e: React.DragEvent, rowIndex: number) => {
    if (draggedRowIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (rowIndex !== draggedRowIndex) {
      setDragOverRowIndex(rowIndex);
    }
  };

  const handleRowDragLeave = () => {
    setDragOverRowIndex(null);
  };

  const handleRowDrop = (e: React.DragEvent, targetRowIndex: number) => {
    if (draggedRowIndex === null || draggedRowIndex === targetRowIndex) {
      setDraggedRowIndex(null);
      setDragOverRowIndex(null);
      return;
    }
    e.preventDefault();
    onQuestionsReorder(draggedRowIndex, targetRowIndex);
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  };

  return (
    <div className="w-full mt-8">
      <table className="w-full border-collapse border border-gray-300">
        <tbody>
          {Array.from({ length: 10 }, (_, index) => {
            const rowIndex = index + 1;
            const isActive = activeRows.has(rowIndex);
            const isDragging = draggedRowIndex === rowIndex;
            const isDragOver = dragOverRowIndex === rowIndex;
            
            return (
              <tr 
                key={rowIndex} 
                draggable={true}
                onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                onDragLeave={handleRowDragLeave}
                onDrop={(e) => handleRowDrop(e, rowIndex)}
                className={`border-b border-gray-300 ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-t-4 border-t-blue-500' : ''} cursor-move`}
              >
                <td className="border-r border-gray-300 px-4 py-3 text-center align-middle w-16">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span className="text-gray-700">{rowIndex}</span>
                  </div>
                </td>
                <td className="border-r border-gray-300 px-4 py-3 align-middle w-full">
                  <div className="relative">
                    <input
                      type="text"
                      value={getQuestionText(rowIndex)}
                      placeholder={`Question ${rowIndex.toString().padStart(2, '0')}`}
                      onClick={() => handleQuestionClick(rowIndex)}
                      onChange={(e) => handleQuestionChange(rowIndex, e.target.value)}
                      disabled={!editableQuestions.has(rowIndex)}
                      className="w-full bg-[#4569871A] pr-12 pl-4 h-[5vh] border border-[#3b5163] rounded-xl outline-none disabled:opacity-70"
                    />
                    <button
                      type="button"
                      onClick={() => setEditableQuestions(prev => {
                        const next = new Set(prev);
                        if (next.has(rowIndex)) next.delete(rowIndex); else next.add(rowIndex);
                        return next;
                      })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-700 hover:bg-gray-50 rounded cursor-pointer"
                      aria-label={editableQuestions.has(rowIndex) ? "Disable editing question" : "Enable editing question"}
                    >
                      <FiEdit size={12} />
                    </button>       
                  </div>
                </td>
                <td className="border-r border-gray-300 px-4 py-3 align-middle ">
                  {isActive ? (
                    <div className="flex gap-2 items-center ">
                      {statusButtons.map((button, idx) => (
                        <div key={button.label} className="relative">
                          <input
                            type="text"
                            value={getOptionText(rowIndex, idx)}
                            onChange={(e) => handleOptionChange(rowIndex, idx, e.target.value)}
                            disabled={!((editableStatus[rowIndex]?.has(idx)) ?? false)}
                            className={`${button.color} ${button.borderColor} ${button.textColor} pr-5 pl-3 py-1.5 w-28 rounded-lg border font-medium text-sm outline-none disabled:opacity-70`}
                          />
                          <button
                            type="button"
                            onClick={() => setEditableStatus(prev => {
                              const next: Record<number, Set<number>> = { ...prev } as Record<number, Set<number>>;
                              const existing = next[rowIndex] ? new Set(Array.from(next[rowIndex])) : new Set<number>();
                              if (existing.has(idx)) {
                                existing.delete(idx);
                              } else {
                                existing.add(idx);
                              }
                              next[rowIndex] = existing;
                              return next;
                            })}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 ${button.textColor} hover:opacity-80 rounded cursor-pointer`}
                            aria-label={((editableStatus[rowIndex]?.has(idx)) ?? false) ? "Disable editing option" : "Enable editing option"}
                          >
                            <FiEdit size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-[30vw]"></div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
