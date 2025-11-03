"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { presentationApi, categoryApi, questionApi } from "@/lib/api";

type OptionState = { text: string; points: number };

interface AddNewAuditProps {
  userId: string;
}

export default function AddNewAudit({ userId }: AddNewAuditProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
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

  const buildAuditData = useMemo(() => {
    const defaultOptions: OptionState[] = Array.from({ length: 5 }, (_, i) => ({ text: `Option ${i + 1}`, points: i + 1 }));
    const questionTextByIndex: Record<number, string> = {};
    for (let i = 0; i < 10; i++) {
      const rowIndex = i + 1;
      const found = tableQuestions.find(q => q.index === rowIndex)?.text?.trim();
      questionTextByIndex[rowIndex] = found && found.length > 0 ? found : `Question ${rowIndex.toString().padStart(2, '0')}`;
    }

    const categoriesData = Array.from({ length: 7 }, (_, catIdx) => ({
      name: `Category ${catIdx + 1}`,
      questions: Array.from({ length: 10 }, (_, qIdx) => {
        const rowIndex = qIdx + 1;
        const labelArray = statusMap[rowIndex];
        const optsFromStatus: OptionState[] | null = Array.isArray(labelArray) && labelArray.length === 5
          ? labelArray.map((t, i) => ({ text: (t || `Option ${i + 1}`).trim(), points: i + 1 }))
          : null;
        const useOptions = optsFromStatus || defaultOptions;
        return {
          text: questionTextByIndex[rowIndex],
          options: useOptions,
        };
      })
    }));

    return {
      title: title.trim(),
      categories: categoriesData,
    };
  }, [title, tableQuestions, statusMap]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const data = buildAuditData;
      sessionStorage.setItem('auditData', JSON.stringify(data));
      data.categories.forEach((cat, idx) => {
        sessionStorage.setItem(`auditData:category:${idx + 1}`, JSON.stringify(cat));
      });
    } catch (e) {
      console.error(e);
    }
  }, [buildAuditData]);

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
        auditData.categories.forEach((cat, idx) => {
          sessionStorage.setItem(`auditData:category:${idx + 1}`, JSON.stringify(cat));
        });
      }

      setSubmitting(true);

      // Keep existing API persistence
      const presentation = await presentationApi.create({ userId, title: title.trim() });
      const categoryIds: string[] = [];
      for (let i = 0; i < 7; i++) {
        const createdCategory = await categoryApi.create({ presentationId: presentation.id, name: auditData.categories[i].name });
        categoryIds.push(createdCategory.id);
      }

      for (let catIdx = 0; catIdx < auditData.categories.length; catIdx++) {
        const cat = auditData.categories[catIdx];
        for (const q of cat.questions) {
          await questionApi.create({ text: q.text, categoryId: categoryIds[catIdx], options: q.options });
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
        <div className="flex gap items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Presentation Name"
              className="w-full bg-[#4569871A]  text-[22px] px-8 py-[18px] border border-[#3b5163] rounded-xl outline-none"
            />
          </div>
          <div className="w-px h-[30px] bg-[#3b5163] mx-7"></div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-[26px] py-[18px] bg-[#CECECE] hover:bg-[#CECECE]/80 transition-all duration-300 rounded-full text-[22px] tracking-[0.352px] leading-normal cursor-pointer"
            >
              Back to List
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-[26px] w-[266px] py-[18px] bg-[#F7AF41] hover:bg-[#F7AF41]/80 disabled:opacity-60 transition-all duration-300 rounded-full text-[22px] tracking-[0.352px] leading-normal cursor-pointer"
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
            onQuestionsChange={setTableQuestions}
            onStatusChange={(rowIndex, labels) => setStatusMap(prev => ({ ...prev, [rowIndex]: labels }))}
          />
        </div>
      </main>
    </div>
  );
}

interface AuditTableProps {
  onQuestionsChange?: (questions: { index: number; text: string }[]) => void;
  onStatusChange?: (rowIndex: number, labels: string[]) => void;
}

function AuditTable({ onQuestionsChange, onStatusChange }: AuditTableProps) {
  const [activeRows, setActiveRows] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<{ [key: number]: string }>({});
  const [statusLabels, setStatusLabels] = useState<Record<number, string[]>>({});

  // Hydrate questions and status labels from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Questions per row 1..10
      const qInit: { [key: number]: string } = {};
      for (let i = 1; i <= 10; i++) {
        const qs = sessionStorage.getItem(`auditData:question:${i}`);
        if (qs && typeof qs === 'string' && qs.length > 0) {
          qInit[i] = qs;
        }
      }

      // If not present, try from auditData (category 1 questions)
      if (Object.keys(qInit).length === 0) {
        const raw = sessionStorage.getItem('auditData');
        if (raw) {
          const parsed = JSON.parse(raw);
          const firstCat = parsed?.categories?.[0];
          if (firstCat?.questions?.length) {
            firstCat.questions.forEach((q: { text?: string }, idx: number) => {
              const rowIndex = idx + 1;
              if (q?.text) qInit[rowIndex] = String(q.text);
            });
          }
        }
      }

      if (Object.keys(qInit).length > 0) {
        setQuestions(qInit);
      }

      // Status labels (options) per row 1..10
      const statusInit: Record<number, string[]> = {};
      for (let i = 1; i <= 10; i++) {
        const st = sessionStorage.getItem(`auditData:status:${i}`);
        if (st) {
          const arr = JSON.parse(st) as unknown;
          if (Array.isArray(arr) && arr.length) statusInit[i] = (arr as unknown[]).map((v) => String(v));
        }
      }

      // If not present, try from auditData options of category 1
      if (Object.keys(statusInit).length === 0) {
        const raw = sessionStorage.getItem('auditData');
        if (raw) {
          const parsed = JSON.parse(raw);
          const firstCat = parsed?.categories?.[0];
          if (firstCat?.questions?.length) {
            firstCat.questions.forEach((q: { options?: { text?: string }[] }, idx: number) => {
              const rowIndex = idx + 1;
              if (Array.isArray(q?.options) && q.options.length) {
                statusInit[rowIndex] = q.options.map((o: { text?: string }) => String(o?.text ?? ''));
              }
            });
          }
        }
      }

      if (Object.keys(statusInit).length > 0) {
        setStatusLabels(statusInit);
      }
    } catch {}
  }, []);

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
        const key = `auditData:status:${rowIndex}`;
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
        sessionStorage.setItem(`auditData:question:${rowIndex}`, value);
      }
    } catch {}
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


