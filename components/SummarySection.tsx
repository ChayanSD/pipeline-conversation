"use client";
import React, { useRef, useState, useEffect } from "react";
import { Image as ImageIcon, Type, RefreshCcw } from "lucide-react";
import { useAudit } from "@/lib/hooks";
import toast from "react-hot-toast";
import axios from "axios";
import Image from "next/image";

type NextStepType = "text" | "file";

interface NextStep {
  type: NextStepType;
  content: string;
  fileUrl?: string;
}

interface SummarySectionProps {
  editId?: string | null;
  isCreateMode: boolean;
  sessionStorageCategories: Array<{ id: string; name: string }>;
}

export default function SummarySection({ editId, isCreateMode, sessionStorageCategories }: SummarySectionProps) {
  const [presentationId, setPresentationId] = useState<string | null>(null);
  
  // Fetch audit data to get categories (only if not available in sessionStorage)
  const hasSessionStorageData = typeof window !== 'undefined' && sessionStorage.getItem('auditData');
  const { data: auditData, isLoading: auditLoading } = useAudit(
    !hasSessionStorageData && presentationId ? presentationId : null
  );
  
  // Fetch summary data (only if not available in sessionStorage)
  const summaryData = typeof window !== 'undefined' && sessionStorage.getItem('summaryData')
  
  const [categoryRecommendations, setCategoryRecommendations] = useState<Record<string, string>>({});
  const [nextSteps, setNextSteps] = useState<NextStep[]>([
    { type: "text", content: "" },
    { type: "text", content: "" },
    { type: "text", content: "" },
  ]);
  const [selections, setSelections] = useState<Array<NextStepType | null>>([null, null, null]);
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [fileUrls, setFileUrls] = useState<(string | null)[]>([null, null, null]);
  const [overallDetails, setOverallDetails] = useState<string>("");
  const [uploading, setUploading] = useState<boolean[]>([false, false, false]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Use a key based on editId or create mode to reset ref when switching audits
  const initializationKeyRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  const getFallbackCategoryName = React.useCallback(
    (categoryNumber: number) => {
      if (typeof window !== "undefined") {
        const storedName = sessionStorage.getItem(
          `auditData:categoryName:${categoryNumber}`
        );
        if (storedName && storedName.trim()) {
          return storedName;
        }

        const auditDataStr = sessionStorage.getItem("auditData");
        if (auditDataStr) {
          try {
            const parsed = JSON.parse(auditDataStr);
            const category =
              parsed?.categories && parsed.categories[categoryNumber - 1];
            if (category?.name) {
              return category.name;
            }
          } catch {}
        }
      }

      if (auditData?.categories?.[categoryNumber - 1]?.name) {
        return auditData.categories[categoryNumber - 1].name;
      }

      return `Category ${categoryNumber}`;
    },
    [auditData?.categories]
  );

  const normalizeCategories = React.useCallback(
    (cats: Array<{ id: string; name: string }>) => {
      const normalized = [...cats]
        .slice(0, 7)
        .map((cat, index) => ({
          id: (cat?.id && cat.id.trim()) ? cat.id : `temp-${index}`,
          name: cat?.name || getFallbackCategoryName(index + 1),
        }));
      for (let i = normalized.length; i < 7; i++) {
        normalized.push({
          id: `temp-${i}`,
          name: getFallbackCategoryName(i + 1),
        });
      }
      return normalized;
    },
    [getFallbackCategoryName]
  );

  useEffect(() => {
    if (editId) {
      setPresentationId(editId);
    } else if (typeof window !== 'undefined') {
      const createdAuditId = sessionStorage.getItem('createdAuditId');
      if (createdAuditId) {
        setPresentationId(createdAuditId);
      } else {
        const auditData = sessionStorage.getItem('auditData');
        if (auditData) {
          try {
            const parsed = JSON.parse(auditData);
            if (parsed.id) {
              setPresentationId(parsed.id);
            }
          } catch {}
        }
      }
    }
  }, [editId]);

  // Initialize data from sessionStorage (priority) or API (fallback)
  // Only initialize once per audit to prevent overwriting user input
  useEffect(() => {
    const currentKey = editId || (isCreateMode ? 'create' : null);
    // Reset initialization if we're on a different audit
    if (initializationKeyRef.current !== currentKey) {
      hasInitializedRef.current = false;
      initializationKeyRef.current = currentKey;
    }
    
    if (hasInitializedRef.current) return;
    
    // Always try to load from sessionStorage first (for both create and update mode)
    if (typeof window !== 'undefined') {
      const summaryDataStr = sessionStorage.getItem('summaryData');
      if (summaryDataStr) {
        try {
          const parsed = JSON.parse(summaryDataStr);
          
          // Load category recommendations (initialize empty if not present)
          const recs: Record<string, string> = {};
          if (parsed.categoryRecommendations && Array.isArray(parsed.categoryRecommendations)) {
            (parsed.categoryRecommendations as Array<{ categoryId: string; recommendation: string }>).forEach(
              (rec: { categoryId: string; recommendation: string }) => {
                recs[rec.categoryId] = rec.recommendation || "";
              }
            );
          }
          
          // Get categories from sessionStorageCategories or fallback to auditData
          let categoriesToUse = sessionStorageCategories;
          if (categoriesToUse.length === 0 && typeof window !== 'undefined') {
            const auditDataStr = sessionStorage.getItem('auditData');
            if (auditDataStr) {
              try {
                const auditData = JSON.parse(auditDataStr);
                if (auditData.categories && Array.isArray(auditData.categories)) {
                  categoriesToUse = auditData.categories.map((cat: { id: string; name: string }) => ({
                    id: cat.id,
                    name: cat.name || `Category ${cat.id}`,
                  }));
                }
              } catch {}
            }
          }
          
          const normalizedInitialCategories = normalizeCategories(categoriesToUse);
          normalizedInitialCategories.forEach((cat) => {
            if (!recs[cat.id]) {
              recs[cat.id] = "";
            }
          });
          
          // Always set recommendations if we have any data
          if (Object.keys(recs).length > 0 || normalizedInitialCategories.length > 0) {
            setCategoryRecommendations(recs);
          }
          
          // Load next steps
          if (parsed.nextSteps && Array.isArray(parsed.nextSteps)) {
            const steps = parsed.nextSteps as NextStep[];
            const newNextSteps: NextStep[] = [
              { type: "text", content: "" },
              { type: "text", content: "" },
              { type: "text", content: "" },
            ];
            const newSelections: Array<NextStepType | null> = [null, null, null];
            const newImages: (string | null)[] = [null, null, null];
            const newFileUrls: (string | null)[] = [null, null, null];
            
            steps.forEach((step, idx) => {
              if (idx < 3) {
                newNextSteps[idx] = step;
                newSelections[idx] = step.type;
                if (step.type === "file" && step.fileUrl) {
                  newFileUrls[idx] = step.fileUrl;
                  newImages[idx] = step.fileUrl;
                } else if (step.type === "text") {
                  newNextSteps[idx] = { type: "text", content: step.content || "" };
                }
              }
            });
            
            setNextSteps(newNextSteps);
            setSelections(newSelections);
            setImages(newImages);
            setFileUrls(newFileUrls);
          }
          
          // Load overall details
          if (parsed.overallDetails !== undefined) {
            setOverallDetails(parsed.overallDetails || "");
          }
          
          hasInitializedRef.current = true;
          // If we loaded from sessionStorage, don't load from API
          return;
        } catch {}
      }
    }
    
    // Fallback to API only if no sessionStorage data exists and not in create mode
    if (!isCreateMode && summaryData && !hasInitializedRef.current) {
      const summary = JSON.parse(summaryData);
      
      if (summary) {
        // Load category recommendations (initialize empty if not present)
        const recs: Record<string, string> = {};
        if (summary.categoryRecommendations) {
          const recommendations = typeof summary.categoryRecommendations === 'string'
            ? JSON.parse(summary.categoryRecommendations)
            : summary.categoryRecommendations;
          if (Array.isArray(recommendations)) {
            (recommendations as Array<{ categoryId: string; recommendation: string }>).forEach(
              (rec) => {
                recs[rec.categoryId] = rec.recommendation || "";
              }
            );
          }
        }
        // Initialize empty for categories that don't have recommendations
        // Use sessionStorageCategories or auditData for categories
        const categoriesToUse = sessionStorageCategories.length > 0 
          ? sessionStorageCategories 
          : (auditData?.categories?.map((cat: { id: string; name: string }) => ({ id: cat.id, name: cat.name })) || []);
        normalizeCategories(categoriesToUse).forEach((cat: { id: string }) => {
          if (!recs[cat.id]) {
            recs[cat.id] = "";
          }
        });
        setCategoryRecommendations(recs);
        
        // Load next steps
        if (summary.nextSteps) {
          const steps = typeof summary.nextSteps === 'string'
            ? JSON.parse(summary.nextSteps)
            : summary.nextSteps;
          const newNextSteps: NextStep[] = [
            { type: "text", content: "" },
            { type: "text", content: "" },
            { type: "text", content: "" },
          ];
          const newSelections: Array<NextStepType | null> = [null, null, null];
          const newImages: (string | null)[] = [null, null, null];
          const newFileUrls: (string | null)[] = [null, null, null];
          
          if (Array.isArray(steps)) {
            steps.forEach((step: NextStep, idx: number) => {
              if (idx < 3) {
                newNextSteps[idx] = step;
                newSelections[idx] = step.type;
                if (step.type === "file" && step.fileUrl) {
                  newFileUrls[idx] = step.fileUrl;
                  newImages[idx] = step.fileUrl;
                } else if (step.type === "text") {
                  newNextSteps[idx] = { type: "text", content: step.content || "" };
                }
              }
            });
          }
          
          setNextSteps(newNextSteps);
          setSelections(newSelections);
          setImages(newImages);
          setFileUrls(newFileUrls);
        }
        
        // Load overall details
        if (summary.overallDetails !== undefined) {
          setOverallDetails(summary.overallDetails || "");
        }
        
        hasInitializedRef.current = true;
      } else {
        // No summary exists - initialize empty for all categories only if we have categories
        // Use sessionStorageCategories or auditData for categories
        const categoriesToUse = sessionStorageCategories.length > 0 
          ? sessionStorageCategories 
          : (auditData?.categories?.map((cat: { id: string; name: string }) => ({ id: cat.id, name: cat.name })) || []);
        if (categoriesToUse.length > 0) {
          const emptyRecs: Record<string, string> = {};
          normalizeCategories(categoriesToUse).forEach((cat: { id: string }) => {
            emptyRecs[cat.id] = "";
          });
          setCategoryRecommendations(emptyRecs);
          hasInitializedRef.current = true;
        }
      }
    } else if (isCreateMode && sessionStorageCategories.length > 0 && !hasInitializedRef.current) {
      // For create mode, initialize empty if we have categories but no summary data
      const emptyRecs: Record<string, string> = {};
      normalizeCategories(sessionStorageCategories).forEach((cat) => {
        emptyRecs[cat.id] = "";
      });
      setCategoryRecommendations(emptyRecs);
      hasInitializedRef.current = true;
    }
  }, [summaryData, isCreateMode, sessionStorageCategories, editId, auditData?.categories, normalizeCategories]); // Include all dependencies but guard with hasInitializedRef to prevent overwriting

  // Update recommendations when sessionStorageCategories loads after initialization
  // This handles the case where categories load after recommendations are already set
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    
    const normalizedSessionCategories = normalizeCategories(sessionStorageCategories);
    setCategoryRecommendations((prev) => {
      const updated = { ...prev };
      let hasChanges = false;
      
      normalizedSessionCategories.forEach((cat: { id: string }, index: number) => {
        if (!(cat.id in updated)) {
          const placeholderKey = `temp-${index}`;
          if (placeholderKey in updated && placeholderKey !== cat.id) {
            updated[cat.id] = updated[placeholderKey];
            delete updated[placeholderKey];
          } else {
            updated[cat.id] = "";
          }
          hasChanges = true;
        }
      });
      
      return hasChanges ? updated : prev;
    });
  }, [sessionStorageCategories, normalizeCategories]);

  // Listen for summary data updates (e.g., when categories are reordered)
  useEffect(() => {
    const handleSummaryDataUpdate = () => {
      if (typeof window === 'undefined') return;
      
      const summaryDataStr = sessionStorage.getItem('summaryData');
      if (summaryDataStr) {
        try {
          const parsed = JSON.parse(summaryDataStr);
          
          // Reload category recommendations from updated summary data
          const recs: Record<string, string> = {};
          if (parsed.categoryRecommendations && Array.isArray(parsed.categoryRecommendations)) {
            (parsed.categoryRecommendations as Array<{ categoryId: string; recommendation: string }>).forEach(
              (rec: { categoryId: string; recommendation: string }) => {
                recs[rec.categoryId] = rec.recommendation || "";
              }
            );
          }
          
          // Ensure all categories have entries (even if empty)
          const categoriesToUse = sessionStorageCategories.length > 0 
            ? sessionStorageCategories 
            : (() => {
                const auditDataStr = sessionStorage.getItem('auditData');
                if (auditDataStr) {
                  try {
                    const auditData = JSON.parse(auditDataStr);
                    if (auditData.categories && Array.isArray(auditData.categories)) {
                      return auditData.categories.map((cat: { id: string; name: string }) => ({
                        id: cat.id,
                        name: cat.name || `Category ${cat.id}`,
                      }));
                    }
                  } catch {}
                }
                return [];
              })();
          
          normalizeCategories(categoriesToUse).forEach((cat: { id: string }) => {
            if (!recs[cat.id]) {
              recs[cat.id] = "";
            }
          });
          
          setCategoryRecommendations(recs);
        } catch (error) {
          console.error('Error reloading summary data:', error);
        }
      }
    };

    window.addEventListener('summaryDataUpdated', handleSummaryDataUpdate);
    return () => {
      window.removeEventListener('summaryDataUpdated', handleSummaryDataUpdate);
    };
  }, [sessionStorageCategories, normalizeCategories]);

  // Listen for category name updates and refresh categories from sessionStorage
  const [refreshedCategories, setRefreshedCategories] = useState<Array<{ id: string; name: string }>>(sessionStorageCategories);
  
  // Update refreshedCategories when sessionStorageCategories prop changes
  useEffect(() => {
    if (sessionStorageCategories.length > 0) {
      // Refresh names from sessionStorage when prop changes
      const updatedCategories = sessionStorageCategories.map((cat, index) => {
        const categoryNumber = index + 1;
        if (typeof window !== 'undefined') {
          const updatedName = sessionStorage.getItem(`auditData:categoryName:${categoryNumber}`);
          return {
            id: cat.id,
            name: updatedName || cat.name || `Category ${categoryNumber}`,
          };
        }
        return cat;
      });
      setRefreshedCategories(updatedCategories);
    }
  }, [sessionStorageCategories]);
  
  useEffect(() => {
    const handleCategoryNameUpdate = () => {
      if (typeof window === 'undefined') return;
      
      // Refresh categories from sessionStorage to get updated names
      const updatedCategories: Array<{ id: string; name: string }> = [];
      
      // Try to get from sessionStorageCategories prop first (has real IDs)
      if (sessionStorageCategories.length > 0) {
        sessionStorageCategories.forEach((cat, index) => {
          const categoryNumber = index + 1;
          const updatedName = sessionStorage.getItem(`auditData:categoryName:${categoryNumber}`);
          updatedCategories.push({
            id: cat.id,
            name: updatedName || cat.name || `Category ${categoryNumber}`,
          });
        });
      } else {
        // Fallback: get from auditData in sessionStorage
        try {
          const auditDataStr = sessionStorage.getItem('auditData');
          if (auditDataStr) {
            const auditData = JSON.parse(auditDataStr);
            if (auditData.categories && Array.isArray(auditData.categories)) {
              auditData.categories.forEach((cat: { id: string; name: string }, index: number) => {
                const categoryNumber = index + 1;
                const updatedName = sessionStorage.getItem(`auditData:categoryName:${categoryNumber}`);
                updatedCategories.push({
                  id: cat.id || `temp-${index}`,
                  name: updatedName || cat.name || `Category ${categoryNumber}`,
                });
              });
            }
          }
        } catch {}
      }
      
      if (updatedCategories.length > 0) {
        setRefreshedCategories(updatedCategories);
      }
    };

    // Initial load
    handleCategoryNameUpdate();

    // Listen for category name updates
    window.addEventListener('categoryNameUpdated', handleCategoryNameUpdate);
    
    // Also listen for storage events (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('auditData:categoryName:')) {
        handleCategoryNameUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('categoryNameUpdated', handleCategoryNameUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sessionStorageCategories]);

  const baseCategories = React.useMemo(() => {
    if (isCreateMode) {
      if (refreshedCategories.length > 0) return refreshedCategories;
      if (sessionStorageCategories.length > 0) return sessionStorageCategories;
      return [];
    }

    if (refreshedCategories.length > 0) return refreshedCategories;
    if (sessionStorageCategories.length > 0) return sessionStorageCategories;
    return (
      auditData?.categories?.map(
        (cat: { id: string; name: string }, index: number) => ({
          id: cat.id,
          name: cat.name || getFallbackCategoryName(index + 1),
        })
      ) || []
    );
  }, [
    isCreateMode,
    refreshedCategories,
    sessionStorageCategories,
    auditData?.categories,
    getFallbackCategoryName,
  ]);

  const categories = React.useMemo(
    () => normalizeCategories(baseCategories),
    [baseCategories, normalizeCategories]
  );

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        uploadData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleImageChange = async (
    index: number,
    file: File | null,
    input: HTMLInputElement
  ) => {
    if (!file) return;

    setUploading((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });

    try {
      const url = await uploadToCloudinary(file);
      setFileUrls((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
      setImages((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
      setNextSteps((prev) => {
        const next = [...prev];
        next[index] = { type: "file", content: "", fileUrl: url };
        return next;
      });
      setSelections((prev) => {
        const next = [...prev];
        next[index] = "file";
        return next;
      });
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading((prev) => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
      input.value = "";
    }
  };

  const handleSelect = (index: number, type: NextStepType) => {
    if (type === "file") {
      fileInputRefs.current[index]?.click();
    } else {
      setSelections((prev) => {
        const next = [...prev];
        next[index] = "text";
        return next;
      });
      setNextSteps((prev) => {
        const next = [...prev];
        next[index] = { type: "text", content: "" };
        return next;
      });
    }
  };

  const openFilePicker = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleChangeOption = (index: number) => {
    const cur = selections[index];
    if (cur === "file") {
      setImages((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      setFileUrls((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      setSelections((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      setNextSteps((prev) => {
        const next = [...prev];
        next[index] = { type: "text", content: "" };
        return next;
      });
    } else if (cur === "text") {
      openFilePicker(index);
    } else {
      openFilePicker(index);
    }
  };

  // Helper function to save summary data to sessionStorage
  const saveSummaryToStorage = React.useCallback(() => {
    if (typeof window === 'undefined' || !hasInitializedRef.current) return;
    
    try {
      let categoryRecs: Array<{ categoryId: string; recommendation: string }> = [];
      
      categoryRecs = categories.map((cat) => ({
        categoryId: cat.id,
        recommendation: categoryRecommendations[cat.id] || "",
      }));

      // Prepare next steps (only include non-empty ones)
      const steps: NextStep[] = [];
      nextSteps.forEach((step, idx) => {
        if (selections[idx]) {
          if (step.type === "file" && fileUrls[idx]) {
            steps.push({ type: "file" as const, content: "", fileUrl: fileUrls[idx]! });
          } else if (step.type === "text" && step.content.trim()) {
            steps.push({ type: "text" as const, content: step.content });
          }
        }
      });

      const summaryDataToSave = {
        categoryRecommendations: categoryRecs,
        nextSteps: steps,
        overallDetails: overallDetails || undefined,
      };

      sessionStorage.setItem('summaryData', JSON.stringify(summaryDataToSave));
    } catch (err) {
      console.error("Error auto-saving summary to sessionStorage:", err);
    }
  }, [categoryRecommendations, nextSteps, selections, overallDetails, fileUrls, categories]);

  // Auto-save summary data to sessionStorage (for both create and update mode)
  // Use a debounce to batch multiple rapid changes
  useEffect(() => {
    if (typeof window === 'undefined' || !hasInitializedRef.current) return;
    
    // Small delay to batch multiple rapid changes
    const timeoutId = setTimeout(() => {
      saveSummaryToStorage();
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timeoutId);
      // Save immediately on unmount to ensure data is persisted
      saveSummaryToStorage();
    };
  }, [saveSummaryToStorage]);

  if (!isCreateMode && auditLoading) {
    return (
      <div className="p-14 bg-white min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden h-[77vh] flex flex-col">
      <main className="flex-1 flex flex-wrap lg:flex-nowrap overflow-hidden px-6 py-4">
        {/* Left Side */}
        <div className="w-full lg:w-1/2 pr-0 lg:pr-6 flex flex-col overflow-hidden">
          <h1 className="text-[24px] leading-[28px] tracking-[0.21px] uppercase mb-3 shrink-0">
            IMPROVEMENT RECOMMENDATIONS
          </h1>
          <div className="flex flex-col flex-1 overflow-hidden gap-2">
            {categories.slice(0, 7).map((category) => (
              <div className="shrink-0" key={category.id}>
                <label className="block text-lg text-[#2B4055] tracking-[0.4px] mb-1">
                  {category.name}
                </label>
                <textarea
                  value={categoryRecommendations[category.id] || ""}
                  onChange={(e) => {
                    setCategoryRecommendations((prev) => ({
                      ...prev,
                      [category.id]: e.target.value,
                    }));
                  }}
                  placeholder="Recommendation"
                  className="w-full h-[5vh] min-h-[40px] p-2 text-sm text-[#2B4055] tracking-[0.4px] font-extralight border border-[#AAA] rounded-lg resize-none outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <hr className="hidden lg:block w-px border border-[#AAA] mx-4" />

        {/* Right Side */}
        <div className="w-full lg:w-1/2 pl-0 lg:pl-6 flex flex-col overflow-hidden mt-6 lg:mt-0">
          <h1 className="text-[24px] leading-[28px] tracking-[0.21px] uppercase shrink-0">
            WHAT ARE THE NEXT STEPS?
          </h1>

          <div className="bg-[#EFEFEF] p-4 rounded-2xl mt-4 flex flex-col flex-1 overflow-hidden">
            {/* Top Boxes */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`flex-1 relative rounded-lg border transition-all duration-200 overflow-hidden ${
                    selections[index]
                      ? "border border-[#2B4055]"
                      : "border border-[#CCC]"
                  } bg-[#E8E8E8]`}
                  style={{ aspectRatio: "1", minHeight: "100px" }}
                >
                  {selections[index] === "file" && images[index] && (
                    <>
                      <Image
                        src={images[index] || ""}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      {uploading[index] && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white">Uploading...</div>
                        </div>
                      )}
                      <button
                        onClick={() => handleChangeOption(index)}
                        className="absolute top-2 right-2 bg-[#2B4055] text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs"
                      >
                        <RefreshCcw className="w-3 h-3" /> Change
                      </button>
                    </>
                  )}

                  {selections[index] === "text" && (
                    <div className="absolute inset-0 flex flex-col">
                      <textarea
                        value={nextSteps[index]?.content || ""}
                        onChange={(e) => {
                          const newNextSteps = [...nextSteps];
                          newNextSteps[index] = {
                            type: "text",
                            content: e.target.value,
                          };
                          setNextSteps(newNextSteps);
                        }}
                        placeholder="Write your text..."
                        className="w-full h-full p-2  text-[#2B4055] font-extralight border-none outline-none resize-none bg-white"
                      />
                      <button
                        onClick={() => handleChangeOption(index)}
                        className="absolute top-2 right-2 bg-[#2B4055] text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs"
                      >
                        <RefreshCcw className="w-3 h-3" /> Change
                      </button>
                    </div>
                  )}

                  {!selections[index] && (
                    <div className="relative w-full h-full cursor-pointer">
                      <div
                        className="absolute inset-0 bg-[#E8E8E8]"
                        style={{
                          clipPath: "polygon(0 0, 100% 0, 0 100%)",
                        }}
                        onClick={() => handleSelect(index, "file")}
                      >
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-[#666]" />
                        </div>
                      </div>

                      <hr className="w-px h-full border border-[#AAA] absolute rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

                      <div
                        className="absolute inset-0 bg-[#E8E8E8]"
                        style={{
                          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                        }}
                        onClick={() => handleSelect(index, "text")}
                      >
                        <div className="absolute bottom-1/4 right-1/2 translate-x-1/2 translate-y-1/2 flex items-center justify-center">
                          <Type className="w-8 h-8 text-[#666]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => {
                      if (el) {
                        fileInputRefs.current[index] = el;
                      }
                    }}
                    onChange={(e) => {
                      const file =
                        e.target.files && e.target.files[0]
                          ? e.target.files[0]
                          : null;
                      handleImageChange(index, file, e.target);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="shrink-0">
              <textarea
                value={overallDetails}
                onChange={(e) => setOverallDetails(e.target.value)}
                placeholder="Add overall next step details..."
                className="w-full h-24 p-3 text-sm text-[#3b5163] border border-[#3b5163] rounded-lg resize-none outline-none bg-white"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

