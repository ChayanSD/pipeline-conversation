"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { presentationApi, categoryApi, questionApi } from "@/lib/api";

type OptionState = { text: string; points: number };

interface AddNewAuditProps {
  userId: string;
}

export default function AddNewAudit({ userId }: AddNewAuditProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = parseInt(searchParams.get('category') || '1', 10);
  
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tableQuestions, setTableQuestions] = useState<{ index: number; text: string }[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, string[]>>({});

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
        question.options = labels.map((t, i) => ({ text: (t || `Option ${i + 1}`).trim(), points: i + 1 }));
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

  const handleCreate = async () => {
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Presentation name is required");
      return;
    }

    const questionTexts = tableQuestions.map(q => q.text).filter(Boolean);
    if (questionTexts.length === 0) {
      setError("Add at least one question in the table");
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

      // Keep API persistence, driven by the current auditData shape
      const presentation = await presentationApi.create({ userId, title: (auditData.title || title).trim() });
      const categoryIds: string[] = [];
      if (Array.isArray(auditData.categories)) {
        for (let i = 0; i < auditData.categories.length; i++) {
          const createdCategory = await categoryApi.create({ presentationId: presentation.id, name: auditData.categories[i].name || `Category ${i + 1}` });
          categoryIds.push(createdCategory.id);
        }
        const catLen = Array.isArray(auditData.categories) ? auditData.categories.length : 0;
        for (let catIdx = 0; catIdx < catLen; catIdx++) {
          const cat = (auditData.categories as { questions: { text?: string; options?: OptionState[] }[] }[])[catIdx];
          for (const q of cat.questions) {
            const text = q.text?.trim();
            if (!text) continue;
            const options = Array.isArray(q.options) && q.options.length === 5
              ? q.options
              : Array.from({ length: 5 }, (_, i) => ({ text: `Option ${i + 1}`, points: i + 1 }));
            await questionApi.create({ text, categoryId: categoryIds[catIdx], options });
          }
        }
      }

      setSuccess("Audit created successfully");
      setTitle("");
      setTableQuestions([]);
      setStatusMap({});
    } catch (e) {
      setError("Failed to create audit");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="">
      <header className="">
        <div className=" flex items-center justify-center gap-2.5 max-w-7xl mx-auto ">
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
        <div
          className="w-full relative z-10"
          style={{
            backgroundImage: "url(/bg-img.png)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 bottom-0 -z-10"
            style={{
              backgroundColor: "rgba(10, 155, 255, 0.3)",
              pointerEvents: "none",
            }}
          />
          <div className="px-24 flex items-center justify-between">
            {["questions", "answers", "score"].map((item,i) => (
              <p key={i} className={`text-[22px] text-white capitalize font-500 tracking-[0.352px] leading-normal font-medium ${i === 1 ? "ml-56":""}`}>
                {item}
              </p>
            ))}
          </div>
        </div>
      </header>
      <main className="px-24 mt-5">
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
              onClick={() => router.push("/dashboard")}
              className="px-[20px] py-[12px] bg-[#CECECE] hover:bg-[#CECECE]/80 transition-all duration-300 rounded-full text-[18px] tracking-[0.352px] leading-normal cursor-pointer"
            >
              Back to List
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-[20px] w-[200px] py-[12px] bg-[#F7AF41] hover:bg-[#F7AF41]/80 disabled:opacity-60 transition-all duration-300 rounded-full text-[18px] tracking-[0.352px] leading-normal cursor-pointer"
            >
              {submitting ? "Creating..." : "Create Audit"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-red-600 text-sm">{error}</div>
        )}
        {success && (
          <div className="mt-4 text-green-700 text-sm">{success}</div>
        )}

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
                  <input
                    type="text"
                    value={questions[rowIndex] || ''}
                    placeholder={`Question ${rowIndex.toString().padStart(2, '0')}`}
                    onClick={() => handleQuestionClick(rowIndex)}
                    onChange={(e) => handleQuestionChange(rowIndex, e.target.value)}
                    className="w-full bg-[#4569871A] px-4 py-2 border border-[#3b5163] rounded-xl outline-none"
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
                <td className="px-4 py-3 text-center align-middle w-16">
                  {isActive && (
                    <span className="text-gray-700">{rowIndex}</span>
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