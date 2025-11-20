"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateAudit } from "@/lib/hooks";
import toast from "react-hot-toast";
import { CustomButton } from "@/components/common";
import SummarySection from "@/components/SummarySection";

type OptionState = { text: string; points: number };

export default function AddNewAudit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = parseInt(searchParams.get('category') || '1', 10);
  const createAuditMutation = useCreateAudit();
  
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState<string>("");
  const [tableQuestions, setTableQuestions] = useState<{ index: number; text: string }[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, string[]>>({});
  const [sessionStorageCategories, setSessionStorageCategories] = useState<Array<{ id: string; name: string; recommendation?: string }>>([]);
  
  // Load categories from sessionStorage
  const loadCategoriesFromStorage = () => {
    if (typeof window === 'undefined') return;
    const auditData = sessionStorage.getItem('auditData');
    if (auditData) {
      try {
        const parsed = JSON.parse(auditData);
        if (Array.isArray(parsed.categories)) {
          const categories = parsed.categories.map((cat: { id?: string; name?: string; recommendation?: string }, idx: number) => ({
            id: cat.id || `temp-${idx}`,
            name: cat.name || `Category ${idx + 1}`,
            recommendation: cat.recommendation || "",
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

  // Hydrate title from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('auditData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.title && typeof parsed.title === 'string') {
          setTitle(parsed.title);
        }
      }
    } catch {}
  }, []);

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

  const handleCategoryRecommendationChange = React.useCallback(
    (categoryId: string, value: string, categoryIndex: number) => {
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

      if (typeof window !== 'undefined' && categoryIndex >= 1) {
        try {
          sessionStorage.setItem(
            `auditData:categoryRecommendation:${categoryIndex}`,
            value
          );
          const raw = sessionStorage.getItem('auditData');
          const data = raw ? JSON.parse(raw) : { categories: [] };
          if (!Array.isArray(data.categories)) data.categories = [];
          const idx = categoryIndex - 1;
          while (data.categories.length <= idx) {
            data.categories.push({
              name: `Category ${data.categories.length + 1}`,
              questions: [],
            });
          }
          data.categories[idx] = {
            ...data.categories[idx],
            recommendation: value,
          };
          sessionStorage.setItem('auditData', JSON.stringify(data));
        } catch (error) {
          console.error('Error saving category recommendation:', error);
        }
      }
    },
    []
  );

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
        const previousCategory = existingCategories[idx] || {};
        existingCategories[idx] = {
          ...previousCategory,
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
      // Preserve summaryData before updating auditData
      const existingSummaryData = sessionStorage.getItem('summaryData');
      
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
      
      // Restore summaryData if it existed (preserve it when navigating between pages)
      if (existingSummaryData) {
        sessionStorage.setItem('summaryData', existingSummaryData);
      }
    } catch (e) {
      console.error(e);
    }
  }, [buildAuditData, currentCategory, categoryName, categoryIcon]);

  const handleCreate = async () => {
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
        return;
      }

      // Get summary data from sessionStorage if it exists
      let summaryData = null;
      if (typeof window !== 'undefined') {
        const summaryDataStr = sessionStorage.getItem('summaryData');
        if (summaryDataStr) {
          try {
            const parsed = JSON.parse(summaryDataStr);
            // Map temp category IDs to category indices (will be mapped to real IDs after creation)
            // For now, we'll use the category index as the identifier
            summaryData = {
              categoryRecommendations: parsed.categoryRecommendations || [],
              nextSteps: parsed.nextSteps || [],
              overallDetails: parsed.overallDetails,
            };
          } catch (error) {
            console.error("Error parsing summary data:", error);
          }
        }
      }

      // Call single audit API with full data
      // IMPORTANT: Summary is sent as a separate field, NOT as part of categories array
      // Categories array only contains categories 1-7, summary is completely separate
      const createdAudit = await createAuditMutation.mutateAsync({
        title: (auditData.title || title).trim(),
        categories, // Only categories 1-7, excludes summary
        ...(summaryData && { summary: summaryData }), // Summary is separate from categories
      });

      toast.success("Audit created successfully");
      
      // Store the created audit ID in sessionStorage before clearing
      if (typeof window !== 'undefined' && createdAudit?.id) {
        sessionStorage.setItem('createdAuditId', createdAudit.id);
        
        // Map temp category IDs to real category IDs and update summary if needed
        if (summaryData && createdAudit.categories) {
          try {
            const categoryMap: Record<string, string> = {};
            createdAudit.categories.forEach((cat, idx) => {
              categoryMap[`temp-${idx}`] = cat.id;
            });
            
            // Clear summary data from sessionStorage
            sessionStorage.removeItem('summaryData');
          } catch (error) {
            console.error("Error updating summary with category IDs:", error);
            // Don't fail the audit creation if summary update fails
            sessionStorage.removeItem('summaryData');
          }
        } else if (summaryData) {
          // Clear summary data from sessionStorage even if update fails
          sessionStorage.removeItem('summaryData');
        }
      }
      
      // Clear all state
      setTitle("");
      setCategoryName("");
      setCategoryIcon("");
      setTableQuestions([]);
      setStatusMap({});
      
      // Clear full sessionStorage after successful creation
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        
        // Dispatch event to update sidebar
        window.dispatchEvent(new Event('categoryNameUpdated'));
      }
      
      // Redirect to home page after successful creation
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (e) {
      toast.error("Failed to create audit. Please try again.");
      console.error(e);
    }
  };

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
      <main className="px-24 pt-5 bg-white h-[90vh] pb-10">
        <div className="flex gap items-center justify-between mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Presentation Name"
              className="w-full bg-[#4569871A]  text-[18px] px-6 py-[12px] border border-[#3b5163] rounded-xl outline-none"
            />
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
              disabled={createAuditMutation.isPending}
              onClick={handleCreate}
            >
              {createAuditMutation.isPending ? "Creating..." : "Create Audit"}
            </CustomButton>
          </div>
        </div>

        {currentCategory === 8 ? (
          <SummarySection
            editId={null}
            isCreateMode={true}
            sessionStorageCategories={sessionStorageCategories}
            onRecommendationChange={handleCategoryRecommendationChange}
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

  return (
    <div className="w-full  mt-8">
      <table className="w-full border-collapse border border-gray-300">
        <tbody>
          {Array.from({ length: 10 }, (_, index) => {
            const rowIndex = index + 1;
            const isActive = activeRows.has(rowIndex);
            
            return (
              <tr key={rowIndex} className="border-b border-gray-300">
                <td className="border-r border-gray-300 px-4 py-3 text-center align-middle w-16">
                  <span className="text-gray-700">{rowIndex}</span>
                </td>
                <td className="border-r border-gray-300 px-4 py-3 align-middle w-full">
                  <input
                    type="text"
                    value={questions[rowIndex] || ''}
                    placeholder={`Question ${rowIndex.toString().padStart(2, '0')}`}
                    onClick={() => handleQuestionClick(rowIndex)}
                    onChange={(e) => handleQuestionChange(rowIndex, e.target.value)}
                    className="w-full bg-[#4569871A] px-4 h-[5vh] border border-[#3b5163] rounded-xl outline-none"
                  />
                </td>
                <td className="border-r border-gray-300 px-4 py-3 align-middle ">
                  {isActive ? (
                    <div className="flex gap-2 items-center ">
                      {statusButtons.map((button, idx) => (
                        <input
                          key={button.label}
                          type="text"
                          value={getStatusValue(rowIndex, idx)}
                          onChange={(e) => setStatusValue(rowIndex, idx, e.target.value)}
                          className={`${button.color} ${button.borderColor} ${button.textColor} pl-3 py-1.5 w-28 rounded-lg border font-medium text-sm outline-none`}
                        />
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