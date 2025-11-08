"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auditApi } from "@/lib/api";
import toast from "react-hot-toast";
import TableSkeleton from "../../add-new-audit/components/tableSkeleton";
import { CustomButton } from "@/components/common";
import { FiEdit } from "react-icons/fi";


type OptionState = { text: string; points: number };

export default function UpdateAudit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = parseInt(searchParams.get('category') || '1', 10);
  const editId = searchParams.get('edit');
  
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tableQuestions, setTableQuestions] = useState<{ index: number; text: string }[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [titleEditable, setTitleEditable] = useState(false);

  // Fetch audit data from API and populate sessionStorage
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
        
        // Set title
        setTitle(audit.title);

        // Prepare audit data structure for sessionStorage
        const auditData = {
          id: audit.id,
          title: audit.title,
          categories: audit.categories.map(cat => ({
            name: cat.name,
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
          sessionStorage.setItem('auditData', JSON.stringify(auditData));
          
          // Store category names separately
          audit.categories.forEach((cat, index) => {
            const categoryNumber = index + 1;
            sessionStorage.setItem(`auditData:categoryName:${categoryNumber}`, cat.name);
            sessionStorage.setItem(`auditData:category:${categoryNumber}`, JSON.stringify({
              name: cat.name,
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
          
          // Dispatch event to update sidebar
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

  // Hydrate category name from sessionStorage on mount or category change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadCategoryName = () => {
      try {
        // Try to get from specific category name storage
        const storedName = sessionStorage.getItem(`auditData:categoryName:${currentCategory}`);
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
      } catch {
        setCategoryName(`Category ${currentCategory}`);
      }
    };

    loadCategoryName();

    // Listen for category name updates from sidebar
    const handleCategoryNameUpdate = () => {
      loadCategoryName();
    };

    window.addEventListener('categoryNameUpdated', handleCategoryNameUpdate);
    return () => window.removeEventListener('categoryNameUpdated', handleCategoryNameUpdate);
  }, [currentCategory]);

  const buildAuditData = useMemo(() => {
    const merged: { title?: string; categories?: Array<{ name?: string; questions: Array<Partial<{ text: string; options: OptionState[] }>> }>; } = {};

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
        question.options = labels.map((t, i) => ({ text: (t || `Option ${i + 1}`).trim(), points: i }));
      }
      questions.push(question);
    }

    // If current category has anything, merge it into the categories array at its index
    if (hasAnyQuestion || hasAnyStatus) {
      const idx = Math.max(0, currentCategory - 1);
      const existingCategories = Array.isArray(merged.categories) ? [...merged.categories] : [];
      // Ensure array has enough length
      while (existingCategories.length < idx + 1) existingCategories.push({ name: `Category ${existingCategories.length + 1}`, questions: [] });
      const finalCategoryName = categoryName.trim() || `Category ${currentCategory}`;
      existingCategories[idx] = {
        name: finalCategoryName,
        questions,
      };
      merged.categories = existingCategories;
    }

    return merged;
  }, [title, tableQuestions, statusMap, currentCategory, categoryName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Save category name separately for sidebar access
      const finalCategoryName = categoryName.trim() || `Category ${currentCategory}`;
      sessionStorage.setItem(`auditData:categoryName:${currentCategory}`, finalCategoryName);
      
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
  }, [buildAuditData, currentCategory, categoryName]);

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
      const categories = (auditData.categories || [])
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
                : Array.from({ length: 5 }, (_, i) => ({
                    text: `Option ${i + 1}`,
                    points: i
                  }))
            }))
            .filter(q => q.text.length > 0);

          return {
            name: cat.name || 'Category',
            questions
          };
        })
        .filter(cat => cat.questions.length > 0);

      if (categories.length === 0) {
        toast.error("Add at least one question in the table");
        setSubmitting(false);
        return;
      }

      // Call update audit API with full data
      await auditApi.update(editId, {
        title: (auditData.title || title).trim(),
        categories
      });

      toast.success("Audit updated successfully");
      
      // Clear all state
      setTitle("");
      setCategoryName("");
      setTableQuestions([]);
      setStatusMap({});
      
      // Clear all sessionStorage audit data after successful update
      if (typeof window !== 'undefined') {
        // Clear main audit data
        sessionStorage.removeItem('auditData');
        
        // Clear all category-related data
        for (let i = 1; i <= 7; i++) {
          sessionStorage.removeItem(`auditData:category:${i}`);
          sessionStorage.removeItem(`auditData:categoryName:${i}`);
          
          // Clear all question and status data for each category
          for (let j = 1; j <= 10; j++) {
            sessionStorage.removeItem(`auditData:question:${i}:${j}`);
            sessionStorage.removeItem(`auditData:status:${i}:${j}`);
          }
        }
        
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

        <div className="mt-8">
          <AuditTable
            currentCategory={currentCategory}
            onQuestionsChange={setTableQuestions}
            onStatusChange={(rowIndex, labels) => setStatusMap(prev => ({ ...prev, [rowIndex]: labels }))}
          />
        </div>
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
      return next;
    });
    try {
      if (typeof window !== 'undefined') {
        const key = `auditData:status:${currentCategory}:${rowIndex}`;
        const current = statusLabels[rowIndex] ? [...statusLabels[rowIndex]] : statusButtons.map(s => s.label);
        current[idx] = value;
        sessionStorage.setItem(key, JSON.stringify(current));
        onStatusChange?.(rowIndex, current);
      }
    } catch {}
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
    <div className="w-full mt-8">
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

