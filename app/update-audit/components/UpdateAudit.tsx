"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auditApi } from "@/lib/api";
import { Presentation } from "@/lib/types";
import toast from "react-hot-toast";
import TableSkeleton from "../../add-new-audit/components/tableSkeleton";
import { CustomButton } from "@/components/common";
import { FiEdit } from "react-icons/fi";
import SummarySection from "@/components/SummarySection";


type OptionState = { text: string; points: number };

export default function UpdateAudit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = parseInt(searchParams.get('category') || '1', 10);
  const editId = searchParams.get('edit');
  
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [tableQuestions, setTableQuestions] = useState<{ index: number; text: string }[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [titleEditable, setTitleEditable] = useState(false);
  const lastProcessedEditIdRef = useRef<string | null>(null);
  const [sessionStorageCategories, setSessionStorageCategories] = useState<Array<{ id: string; name: string }>>([]);
  
  // Load categories from sessionStorage
  const loadCategoriesFromStorage = () => {
    if (typeof window === 'undefined') return;
    const auditData = sessionStorage.getItem('auditData');
    if (auditData) {
      try {
        const parsed = JSON.parse(auditData);
        if (Array.isArray(parsed.categories)) {
          const categories = parsed.categories.map((cat: { id?: string; name?: string }, idx: number) => ({
            id: cat.id || `temp-${idx}`,
            name: cat.name || `Category ${idx + 1}`,
          }));
          setSessionStorageCategories(categories);
        }
      } catch {}
    }
  };

  useEffect(() => {
    loadCategoriesFromStorage();
    const handleStorageChange = () => {
      loadCategoriesFromStorage();
    };
    window.addEventListener('categoryNameUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('categoryNameUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch audit data from API and populate sessionStorage (only if audit ID changes)
  useEffect(() => {
    if (!editId) {
      toast.error("Audit ID is missing");
      setLoading(false);
      router.push("/");
      return;
    }

    // If we've already processed this editId, don't refetch
    if (lastProcessedEditIdRef.current === editId) {
      setLoading(false);
      return;
    }

    // Check if we already have data for this audit ID in sessionStorage
    // If yes, skip the API call to avoid refetching and overwriting summary data
    if (typeof window !== 'undefined') {
      const existingAuditData = sessionStorage.getItem('auditData');
      if (existingAuditData) {
        try {
          const parsed = JSON.parse(existingAuditData);
          if (parsed.id === editId) {
            // We have data for this audit ID in sessionStorage, don't refetch
            // This means we're navigating from summary page or already loaded this audit
            // Load title and dispatch event to update sidebar
            if (parsed.title) {
              setTitle(parsed.title);
            }
            // Dispatch event to update sidebar with existing data
            window.dispatchEvent(new Event('categoryNameUpdated'));
            setLoading(false);
            lastProcessedEditIdRef.current = editId;
            return;
          }
        } catch {}
      }
    }

    const fetchAuditData = async () => {
      try {
        setLoading(true);
        const audit = await auditApi.getById(editId);
        
        // Set title
        setTitle(audit.title);

        // Prepare audit data structure for sessionStorage
        const auditData = {
          id: audit.id,
          title: audit.title,
          categories: audit.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || undefined,
            questions: cat.questions.map(q => ({
              text: q.text,
              options: q.options.map(opt => ({
                text: opt.text,
                points: opt.points
              }))
            }))
          }))
        };

        // Store in sessionStorage
        if (typeof window !== 'undefined') {
          // Check if summary data exists for this audit - preserve it if same audit ID
          const existingSummaryData = sessionStorage.getItem('summaryData');
          const existingAuditData = sessionStorage.getItem('auditData');
          let shouldPreserveSummary = false;
          
          if (existingAuditData && existingSummaryData) {
            try {
              const parsedAudit = JSON.parse(existingAuditData);
              if (parsedAudit.id === editId) {
                // Same audit ID - preserve existing summary data
                shouldPreserveSummary = true;
              }
            } catch {}
          }
          
          sessionStorage.setItem('auditData', JSON.stringify(auditData));
          
          // Store category names and icons separately
          audit.categories.forEach((cat, index) => {
            const categoryNumber = index + 1;
            sessionStorage.setItem(`auditData:categoryName:${categoryNumber}`, cat.name);
            // Store icon if available
            if (cat.icon) {
              sessionStorage.setItem(`auditData:categoryIcon:${categoryNumber}`, cat.icon);
            } else {
              sessionStorage.removeItem(`auditData:categoryIcon:${categoryNumber}`);
            }
            sessionStorage.setItem(`auditData:category:${categoryNumber}`, JSON.stringify({
              name: cat.name,
              icon: cat.icon || undefined,
              questions: cat.questions.map(q => ({
                text: q.text,
                options: q.options.map(opt => ({
                  text: opt.text,
                  points: opt.points
                }))
              }))
            }));
            
            // Store questions and status for each category
            cat.questions.forEach((q, qIndex) => {
              const rowIndex = qIndex + 1;
              sessionStorage.setItem(`auditData:question:${categoryNumber}:${rowIndex}`, q.text);
              const statusLabels = q.options.map(opt => opt.text);
              sessionStorage.setItem(`auditData:status:${categoryNumber}:${rowIndex}`, JSON.stringify(statusLabels));
            });
          });
          
          // Only update summary data if audit ID changed or if no summary exists
          if (!shouldPreserveSummary) {
            // Store summary data - initialize with empty values if no summary exists
            const auditWithSummary = audit as Presentation & { summary?: { categoryRecommendations?: string | unknown; nextSteps?: string | unknown; overallDetails?: string | null } | null };
            if (auditWithSummary.summary) {
              const summary = auditWithSummary.summary;
              let categoryRecommendations = summary.categoryRecommendations 
                ? (typeof summary.categoryRecommendations === 'string' 
                    ? JSON.parse(summary.categoryRecommendations) 
                    : summary.categoryRecommendations)
                : [];
              
              // Map temp IDs to real category IDs if needed
              // This handles the case where summaryData has temp IDs from create mode
              if (Array.isArray(categoryRecommendations)) {
                categoryRecommendations = categoryRecommendations.map((rec: { categoryId: string; recommendation: string }, index: number) => {
                  // If categoryId is a temp ID (temp-0, temp-1, etc.), map it to real category ID
                  if (rec.categoryId && rec.categoryId.startsWith('temp-')) {
                    const tempIndex = parseInt(rec.categoryId.replace('temp-', ''), 10);
                    if (!isNaN(tempIndex) && audit.categories[tempIndex]) {
                      return {
                        categoryId: audit.categories[tempIndex].id,
                        recommendation: rec.recommendation || "",
                      };
                    }
                  }
                  // If categoryId already exists in audit categories, keep it
                  const categoryExists = audit.categories.some(cat => cat.id === rec.categoryId);
                  if (categoryExists) {
                    return rec;
                  }
                  // If categoryId doesn't match, try to map by index
                  if (audit.categories[index]) {
                    return {
                      categoryId: audit.categories[index].id,
                      recommendation: rec.recommendation || "",
                    };
                  }
                  return rec;
                });
              }
              
              // Ensure all categories have entries (even if empty)
              const allCategoryRecommendations = audit.categories.map((cat) => {
                const existing = Array.isArray(categoryRecommendations) 
                  ? categoryRecommendations.find((rec: { categoryId: string }) => rec.categoryId === cat.id)
                  : null;
                return existing || {
                  categoryId: cat.id,
                  recommendation: "",
                };
              });
              
              const summaryData = {
                categoryRecommendations: allCategoryRecommendations,
                nextSteps: summary.nextSteps
                  ? (typeof summary.nextSteps === 'string'
                      ? JSON.parse(summary.nextSteps)
                      : summary.nextSteps)
                  : [],
                overallDetails: summary.overallDetails || undefined,
              };
              sessionStorage.setItem('summaryData', JSON.stringify(summaryData));
            } else {
              // Initialize empty summary data for all categories with real IDs
              const emptySummaryData = {
                categoryRecommendations: audit.categories.map((cat) => ({
                  categoryId: cat.id,
                  recommendation: "",
                })),
                nextSteps: [],
                overallDetails: "",
              };
              sessionStorage.setItem('summaryData', JSON.stringify(emptySummaryData));
            }
          } else {
            // If preserving summary, still need to map temp IDs to real IDs
            const existingSummaryDataStr = sessionStorage.getItem('summaryData');
            if (existingSummaryDataStr) {
              try {
                const existingSummaryData = JSON.parse(existingSummaryDataStr);
                if (existingSummaryData.categoryRecommendations && Array.isArray(existingSummaryData.categoryRecommendations)) {
                  // Map temp IDs to real category IDs
                  const mappedRecommendations = existingSummaryData.categoryRecommendations.map((rec: { categoryId: string; recommendation: string }, index: number) => {
                    if (rec.categoryId && rec.categoryId.startsWith('temp-')) {
                      const tempIndex = parseInt(rec.categoryId.replace('temp-', ''), 10);
                      if (!isNaN(tempIndex) && audit.categories[tempIndex]) {
                        return {
                          categoryId: audit.categories[tempIndex].id,
                          recommendation: rec.recommendation || "",
                        };
                      }
                    }
                    // If categoryId already exists in audit categories, keep it
                    const categoryExists = audit.categories.some(cat => cat.id === rec.categoryId);
                    if (categoryExists) {
                      return rec;
                    }
                    // If categoryId doesn't match, try to map by index
                    if (audit.categories[index]) {
                      return {
                        categoryId: audit.categories[index].id,
                        recommendation: rec.recommendation || "",
                      };
                    }
                    return rec;
                  });
                  
                  // Ensure all categories have entries
                  const allCategoryRecommendations = audit.categories.map((cat) => {
                    const existing = mappedRecommendations.find((rec: { categoryId: string }) => rec.categoryId === cat.id);
                    return existing || {
                      categoryId: cat.id,
                      recommendation: "",
                    };
                  });
                  
                  existingSummaryData.categoryRecommendations = allCategoryRecommendations;
                  sessionStorage.setItem('summaryData', JSON.stringify(existingSummaryData));
                }
              } catch (error) {
                console.error("Error mapping temp IDs to real category IDs:", error);
              }
            }
          }
          
          // Dispatch event to update sidebar
          window.dispatchEvent(new Event('categoryNameUpdated'));
          
          // Mark this editId as processed
          lastProcessedEditIdRef.current = editId;
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

  // Hydrate category name and icon from sessionStorage on mount or category change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadCategoryData = () => {
      try {
        // If category is 8, it's the summary
        if (currentCategory === 8) {
          setCategoryName('Summary');
          setCategoryIcon("");
          return;
        }
        // Try to get from specific category storage
        const storedName = sessionStorage.getItem(`auditData:categoryName:${currentCategory}`);
        const storedIcon = sessionStorage.getItem(`auditData:categoryIcon:${currentCategory}`);
        
        if (storedName) {
          setCategoryName(storedName);
        } else {
          // Try to get from auditData categories array
          const raw = sessionStorage.getItem('auditData');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.categories)) {
              const cat = parsed.categories[currentCategory - 1];
              if (cat?.name) {
                setCategoryName(cat.name);
              } else {
                setCategoryName(`Category ${currentCategory}`);
              }
            } else {
              setCategoryName(`Category ${currentCategory}`);
            }
          } else {
            setCategoryName(`Category ${currentCategory}`);
          }
        }
        
        // Load icon
        if (storedIcon) {
          setCategoryIcon(storedIcon);
        } else {
          // Try to get from auditData categories array
          const raw = sessionStorage.getItem('auditData');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.categories)) {
              const cat = parsed.categories[currentCategory - 1];
              if (cat?.icon) {
                setCategoryIcon(cat.icon);
              } else {
                setCategoryIcon("");
              }
            } else {
              setCategoryIcon("");
            }
          } else {
            setCategoryIcon("");
          }
        }
      } catch {
        setCategoryName(currentCategory === 8 ? 'Summary' : `Category ${currentCategory}`);
        setCategoryIcon("");
      }
    };

    loadCategoryData();

    // Listen for category updates from sidebar
    const handleCategoryUpdate = () => {
      loadCategoryData();
    };

    window.addEventListener('categoryNameUpdated', handleCategoryUpdate);
    return () => window.removeEventListener('categoryNameUpdated', handleCategoryUpdate);
  }, [currentCategory]);

  const buildAuditData = useMemo(() => {
    const merged: { title?: string; categories?: Array<{ name?: string; icon?: string; questions: Array<Partial<{ text: string; options: OptionState[] }>> }>; } = {};

    // Start from any previously saved auditData (to keep other categories intact)
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('auditData');
        if (raw) {
          const prev = JSON.parse(raw);
          if (prev && typeof prev === 'object') {
            if (typeof prev.title === 'string') merged.title = prev.title;
            if (Array.isArray(prev.categories)) merged.categories = prev.categories;
          }
        }
      } catch {}
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle) merged.title = trimmedTitle;

    // Determine if any per-row inputs exist for current category
    const hasAnyQuestion = tableQuestions.some(q => (q.text?.trim()?.length || 0) > 0);
    const hasAnyStatus = Object.keys(statusMap).length > 0;

    // Build the current category questions snapshot (even if empty, we will only write if there is something)
    const questions: Array<Partial<{ text: string; options: OptionState[] }>> = [];
    for (let qIdx = 0; qIdx < 10; qIdx++) {
      const rowIndex = qIdx + 1;
      const qText = tableQuestions.find(q => q.index === rowIndex)?.text?.trim();
      const labels = statusMap[rowIndex];
      const question: Partial<{ text: string; options: OptionState[] }> = {};
      if (qText) question.text = qText;
      if (Array.isArray(labels) && labels.length === 5) {
        const defaultLabels = ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"];
        question.options = labels.map((t, i) => {
          return { text: (t && t.trim()) ? t.trim() : defaultLabels[i], points: i + 1 };
        });
      }
      questions.push(question);
    }

    // If current category has anything, merge it into the categories array at its index
    // IMPORTANT: Only process categories 1-7, exclude summary (category 8)
    if ((hasAnyQuestion || hasAnyStatus) && currentCategory >= 1 && currentCategory <= 7) {
      const idx = Math.max(0, currentCategory - 1);
      const existingCategories = Array.isArray(merged.categories) ? [...merged.categories] : [];
      // Ensure array has enough length (max 7 categories)
      while (existingCategories.length < idx + 1 && existingCategories.length < 7) {
        existingCategories.push({ name: `Category ${existingCategories.length + 1}`, questions: [] });
      }
      // Only update if index is within valid range (0-6 for categories 1-7)
      if (idx < 7) {
        const finalCategoryName = categoryName.trim() || `Category ${currentCategory}`;
        const finalCategoryIcon = categoryIcon.trim() || undefined;
        existingCategories[idx] = {
          name: finalCategoryName,
          icon: finalCategoryIcon,
          questions,
        };
        // Ensure we don't exceed 7 categories - filter out any items at index 7 or higher
        merged.categories = existingCategories.filter((cat, index) => index < 7);
      }
    }

    return merged;
  }, [title, tableQuestions, statusMap, currentCategory, categoryName, categoryIcon]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Save category name and icon separately for sidebar access
      const finalCategoryName = categoryName.trim() || `Category ${currentCategory}`;
      const finalCategoryIcon = categoryIcon.trim() || "";
      sessionStorage.setItem(`auditData:categoryName:${currentCategory}`, finalCategoryName);
      if (finalCategoryIcon) {
        sessionStorage.setItem(`auditData:categoryIcon:${currentCategory}`, finalCategoryIcon);
      } else {
        sessionStorage.removeItem(`auditData:categoryIcon:${currentCategory}`);
      }
      
      const data = buildAuditData;
      sessionStorage.setItem('auditData', JSON.stringify(data));
      if (Array.isArray(data.categories)) {
        data.categories.forEach((cat, i) => {
          const categoryNumber = i + 1;
          sessionStorage.setItem(`auditData:category:${categoryNumber}`, JSON.stringify(cat));
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [buildAuditData, currentCategory, categoryName, categoryIcon]);

  const handleUpdate = async () => {
    if (!editId) {
      toast.error("Audit ID is missing");
      return;
    }

    if (!title.trim()) {
      toast.error("Presentation name is required");
      return;
    }

    const questionTexts = tableQuestions.map(q => q.text).filter(Boolean);
    if (questionTexts.length === 0) {
      toast.error("Add at least one question in the table");
      return;
    }

    // Build full audit payload for sessionStorage
    const auditData = buildAuditData;

    try {
      // Persist to sessionStorage (whole audit and per-category)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auditData', JSON.stringify(auditData));
        if (Array.isArray(auditData.categories)) {
          auditData.categories.forEach((cat, i) => {
            const categoryNumber = i + 1;
            sessionStorage.setItem(`auditData:category:${categoryNumber}`, JSON.stringify(cat));
          });
        }
      }

      setSubmitting(true);

      // Transform auditData to match API format
      // IMPORTANT: Only include categories 1-7, exclude summary (category 8)
      // Filter by array index: index 0-6 = categories 1-7, index 7+ = category 8+ (summary) - exclude
      const allCategories = auditData.categories || [];
      const categories = allCategories
        .filter((cat, index) => index < 7) // Only include categories at index 0-6 (categories 1-7)
        .map(cat => {
          // Filter out empty questions and ensure each question has 5 options
          const questions = cat.questions
            .filter(q => q.text && q.text.trim().length > 0)
            .map(q => ({
              text: q.text!.trim(),
              options: (Array.isArray(q.options) && q.options.length === 5)
                ? q.options.map(opt => ({
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
            name: cat.name || 'Category',
            icon: (cat.icon && cat.icon.trim()) ? cat.icon.trim() : undefined,
            questions
          };
        })
        .filter(cat => cat.questions.length > 0);

      if (categories.length === 0) {
        toast.error("Add at least one question in the table");
        setSubmitting(false);
        return;
      }

      // Get summary data from sessionStorage if it exists
      let summaryData = null;
      if (typeof window !== 'undefined') {
        const summaryDataStr = sessionStorage.getItem('summaryData');
        if (summaryDataStr) {
          try {
            const parsed = JSON.parse(summaryDataStr);
            // Map category recommendations by index since categories are recreated in order
            // The categoryRecommendations will be mapped to new category IDs in the API
            // For now, we'll use the index-based mapping which will be handled by the API
            const mappedRecommendations = Array.isArray(parsed.categoryRecommendations)
              ? parsed.categoryRecommendations.map((rec: { categoryId: string; recommendation: string }) => ({
                  // Use index-based mapping - the API will handle mapping to actual category IDs
                  categoryId: rec.categoryId, // Keep original ID, API will map by order
                  recommendation: rec.recommendation,
                }))
              : [];
            
            summaryData = {
              categoryRecommendations: mappedRecommendations,
              nextSteps: parsed.nextSteps || [],
              overallDetails: parsed.overallDetails,
            };
          } catch (error) {
            console.error("Error parsing summary data:", error);
          }
        }
      }

      // Call update audit API with full data
      // IMPORTANT: Summary is sent as a separate field, NOT as part of categories array
      // Categories array only contains categories 1-7, summary is completely separate
      await auditApi.update(editId, {
        title: (auditData.title || title).trim(),
        categories, // Only categories 1-7, excludes summary
        ...(summaryData && { summary: summaryData }), // Summary is separate from categories
      });

      toast.success("Audit updated successfully");
      
      // Clear all state
      setTitle("");
      setCategoryName("");
      setCategoryIcon("");
      setTableQuestions([]);
      setStatusMap({});
      
      // Clear full sessionStorage after successful update
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        
        // Dispatch event to update sidebar
        window.dispatchEvent(new Event('categoryNameUpdated'));
      }
      
      // Redirect to home page after successful update
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              disabled={submitting}
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
          />
        ) : (
          <div className="mt-8">
            <AuditTable
              currentCategory={currentCategory}
              onQuestionsChange={setTableQuestions}
              onStatusChange={(rowIndex, labels) => setStatusMap(prev => ({ ...prev, [rowIndex]: labels }))}
            />
          </div>
        )}
      </main>
    </div>
  );
}

interface AuditTableProps {
  currentCategory: number;
  onQuestionsChange?: (questions: { index: number; text: string }[]) => void;
  onStatusChange?: (rowIndex: number, labels: string[]) => void;
}

function AuditTable({ currentCategory, onQuestionsChange, onStatusChange }: AuditTableProps) {
  const [activeRows, setActiveRows] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<{ [key: number]: string }>({});
  const [statusLabels, setStatusLabels] = useState<Record<number, string[]>>({});
  const [editableQuestions, setEditableQuestions] = useState<Set<number>>(new Set());
  const [editableStatus, setEditableStatus] = useState<Record<number, Set<number>>>({});
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  // Hydrate questions and status labels from sessionStorage on mount or category change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Questions per row 1..10 for current category
      const qInit: { [key: number]: string } = {};
      for (let i = 1; i <= 10; i++) {
        const qs = sessionStorage.getItem(`auditData:question:${currentCategory}:${i}`);
        if (qs && typeof qs === 'string' && qs.length > 0) {
          qInit[i] = qs;
        }
      }

      // If not present, try from auditData (specific category)
      if (Object.keys(qInit).length === 0) {
        const categoryData = sessionStorage.getItem(`auditData:category:${currentCategory}`);
        if (categoryData) {
          const parsed = JSON.parse(categoryData);
          if (parsed?.questions?.length) {
            parsed.questions.forEach((q: { text?: string }, idx: number) => {
              const rowIndex = idx + 1;
              if (q?.text) qInit[rowIndex] = String(q.text);
            });
          }
        }
      }

      setQuestions(qInit);

      // Status labels (options) per row 1..10 for current category
      const statusInit: Record<number, string[]> = {};
      for (let i = 1; i <= 10; i++) {
        const st = sessionStorage.getItem(`auditData:status:${currentCategory}:${i}`);
        if (st) {
          const arr = JSON.parse(st) as unknown;
          if (Array.isArray(arr) && arr.length) statusInit[i] = (arr as unknown[]).map((v) => String(v));
        }
      }

      // If not present, try from auditData options of specific category
      if (Object.keys(statusInit).length === 0) {
        const categoryData = sessionStorage.getItem(`auditData:category:${currentCategory}`);
        if (categoryData) {
          const parsed = JSON.parse(categoryData);
          if (parsed?.questions?.length) {
            parsed.questions.forEach((q: { options?: { text?: string }[] }, idx: number) => {
              const rowIndex = idx + 1;
              if (Array.isArray(q?.options) && q.options.length) {
                statusInit[rowIndex] = q.options.map((o: { text?: string }) => String(o?.text ?? ''));
              }
            });
          }
        }
      }

      setStatusLabels(statusInit);

      // Auto-activate rows that have restored content (question or status)
      const rowsToActivate = new Set<number>();
      for (let i = 1; i <= 10; i++) {
        const hasQ = typeof qInit[i] === 'string' && qInit[i].trim().length > 0;
        const hasS = Array.isArray(statusInit[i]) && statusInit[i].length > 0;
        if (hasQ || hasS) rowsToActivate.add(i);
      }
      setActiveRows(rowsToActivate);
    } catch {}
  }, [currentCategory]);

  useEffect(() => {
    if (!onQuestionsChange) return;
    const list = Object.keys(questions)
      .map(k => ({ index: Number(k), text: questions[Number(k)]?.trim?.() || '' }))
      .filter(q => q.text.length > 0)
      .sort((a, b) => a.index - b.index);
    onQuestionsChange(list);
  }, [questions, onQuestionsChange]);

  const handleQuestionClick = (rowIndex: number) => {
    setActiveRows(prev => {
      const newSet = new Set(prev);
      newSet.add(rowIndex);
      return newSet;
    });
  };

  const getStatusValue = (rowIndex: number, idx: number) => {
    const row = statusLabels[rowIndex];
    if (row && row[idx] !== undefined) return row[idx];
    return statusButtons[idx].label;
  };

  const setStatusValue = (rowIndex: number, idx: number, value: string) => {
    setStatusLabels(prev => {
      const next = { ...prev };
      const row = next[rowIndex] ? [...next[rowIndex]] : statusButtons.map(s => s.label);
      row[idx] = value;
      next[rowIndex] = row;
      
      // Save to sessionStorage and notify parent with the updated value
      try {
        if (typeof window !== 'undefined') {
          const key = `auditData:status:${currentCategory}:${rowIndex}`;
          sessionStorage.setItem(key, JSON.stringify(row));
          onStatusChange?.(rowIndex, row);
        }
      } catch {}
      
      return next;
    });
  };

  const handleQuestionChange = (rowIndex: number, value: string) => {
    setQuestions(prev => ({
      ...prev,
      [rowIndex]: value
    }));
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`auditData:question:${currentCategory}:${rowIndex}`, value);
      }
    } catch {}

    // Auto-add options for this question if not present yet, using current status labels (defaults)
    if (!statusLabels[rowIndex] || statusLabels[rowIndex].length !== 5) {
      const defaults = statusButtons.map(s => s.label);
      setStatusLabels(prev => ({ ...prev, [rowIndex]: defaults }));
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`auditData:status:${currentCategory}:${rowIndex}`, JSON.stringify(defaults));
        }
      } catch {}
      onStatusChange?.(rowIndex, defaults);
    }
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
    // Don't start drag if clicking on input, button, or other interactive elements
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

    // Reorder questions and status labels
    const newQuestions: { [key: number]: string } = {};
    const newStatusLabels: Record<number, string[]> = {};
    const newActiveRows = new Set<number>();
    const newEditableQuestions = new Set<number>();
    const newEditableStatus: Record<number, Set<number>> = {};

    // Get all row indices in order
    const allRowIndices = Array.from({ length: 10 }, (_, i) => i + 1);
    
    // Create arrays for reordering
    const questionArray = allRowIndices.map(idx => ({
      index: idx,
      text: questions[idx] || '',
      status: statusLabels[idx] || [],
      isActive: activeRows.has(idx),
      isEditable: editableQuestions.has(idx),
      editableStatus: editableStatus[idx] || new Set<number>(),
    }));

    // Reorder: move dragged item to target position
    const draggedItem = questionArray[draggedRowIndex - 1];
    questionArray.splice(draggedRowIndex - 1, 1);
    questionArray.splice(targetRowIndex - 1, 0, draggedItem);

    // Rebuild state objects with new order
    questionArray.forEach((item, newIndex) => {
      const newRowIndex = newIndex + 1;
      if (item.text) {
        newQuestions[newRowIndex] = item.text;
      }
      if (item.status.length > 0) {
        newStatusLabels[newRowIndex] = item.status;
      }
      if (item.isActive) {
        newActiveRows.add(newRowIndex);
      }
      if (item.isEditable) {
        newEditableQuestions.add(newRowIndex);
      }
      if (item.editableStatus.size > 0) {
        newEditableStatus[newRowIndex] = item.editableStatus;
      }
    });

    // Update state
    setQuestions(newQuestions);
    setStatusLabels(newStatusLabels);
    setActiveRows(newActiveRows);
    setEditableQuestions(newEditableQuestions);
    setEditableStatus(newEditableStatus);

    // Update sessionStorage
    if (typeof window !== 'undefined') {
      try {
        // Clear existing questions and status for this category
        for (let i = 1; i <= 10; i++) {
          sessionStorage.removeItem(`auditData:question:${currentCategory}:${i}`);
          sessionStorage.removeItem(`auditData:status:${currentCategory}:${i}`);
        }

        // Save reordered questions and status
        Object.keys(newQuestions).forEach((key) => {
          const rowIndex = Number(key);
          const questionText = newQuestions[rowIndex];
          if (questionText) {
            sessionStorage.setItem(`auditData:question:${currentCategory}:${rowIndex}`, questionText);
          }
        });

        Object.keys(newStatusLabels).forEach((key) => {
          const rowIndex = Number(key);
          const status = newStatusLabels[rowIndex];
          if (status && status.length > 0) {
            sessionStorage.setItem(`auditData:status:${currentCategory}:${rowIndex}`, JSON.stringify(status));
          }
        });

        // Update category data in sessionStorage
        const categoryData = sessionStorage.getItem(`auditData:category:${currentCategory}`);
        if (categoryData) {
          const parsed = JSON.parse(categoryData);
          const reorderedQuestions: Array<{ text: string; options: Array<{ text: string; points: number }> }> = [];
          
          for (let i = 1; i <= 10; i++) {
            const questionText = newQuestions[i];
            const status = newStatusLabels[i];
            if (questionText || (status && status.length > 0)) {
              reorderedQuestions.push({
                text: questionText || '',
                options: status && status.length === 5
                  ? status.map((text, idx) => {
                      const defaultLabels = ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"];
                      return { text: (text && text.trim()) ? text.trim() : defaultLabels[idx], points: idx + 1 };
                    })
                  : ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"].map((text, idx) => ({ text: text, points: idx + 1 })),
              });
            }
          }

          parsed.questions = reorderedQuestions;
          sessionStorage.setItem(`auditData:category:${currentCategory}`, JSON.stringify(parsed));
        }

        // Update main auditData
        const auditDataRaw = sessionStorage.getItem('auditData');
        if (auditDataRaw) {
          const auditData = JSON.parse(auditDataRaw);
          if (Array.isArray(auditData.categories)) {
            const categoryIndex = currentCategory - 1;
            if (auditData.categories[categoryIndex]) {
              const reorderedQuestions: Array<{ text: string; options: Array<{ text: string; points: number }> }> = [];
              
              for (let i = 1; i <= 10; i++) {
                const questionText = newQuestions[i];
                const status = newStatusLabels[i];
                if (questionText || (status && status.length > 0)) {
                  reorderedQuestions.push({
                    text: questionText || '',
                    options: status && status.length === 5
                      ? status.map((text, idx) => ({ text, points: idx + 1 }))
                      : ["Very Minimal", "Just Starting", "Good progress", "Excellent", "Very Excellent"].map((text, idx) => ({ text: text, points: idx + 1 })),
                  });
                }
              }

              auditData.categories[categoryIndex].questions = reorderedQuestions;
              sessionStorage.setItem('auditData', JSON.stringify(auditData));
            }
          }
        }

        // Notify parent component
        onQuestionsChange?.(Object.keys(newQuestions).map(key => ({
          index: Number(key),
          text: newQuestions[Number(key)],
        })));

        Object.keys(newStatusLabels).forEach((key) => {
          const rowIndex = Number(key);
          onStatusChange?.(rowIndex, newStatusLabels[rowIndex]);
        });
      } catch (error) {
        console.error('Error reordering questions:', error);
      }
    }

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
                      value={questions[rowIndex] || ''}
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
                            value={getStatusValue(rowIndex, idx)}
                            onChange={(e) => setStatusValue(rowIndex, idx, e.target.value)}
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
  )
}

