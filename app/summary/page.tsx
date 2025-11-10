"use client";
import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Image as ImageIcon, Type, RefreshCcw } from "lucide-react";
import { useSummary, useAudit } from "@/lib/hooks";
import toast from "react-hot-toast";
import axios from "axios";
import Image from "next/image";

type NextStepType = "text" | "file";

interface NextStep {
  type: NextStepType;
  content: string;
  fileUrl?: string;
}

export default function SummaryPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  // Get presentation ID - either from edit param or from sessionStorage (for add-new-audit)
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
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
    if (editId) {
      setPresentationId(editId);
      setIsCreateMode(false);
      // Load categories from sessionStorage for update mode
      loadCategoriesFromStorage();
    } else if (typeof window !== 'undefined') {
      // Try to get from sessionStorage (for add-new-audit flow)
      // First check for created audit ID
      const createdAuditId = sessionStorage.getItem('createdAuditId');
      if (createdAuditId) {
        setPresentationId(createdAuditId);
        setIsCreateMode(false);
      } else {
        // Check if we have auditData in sessionStorage (create mode)
        const auditData = sessionStorage.getItem('auditData');
        if (auditData) {
          try {
            const parsed = JSON.parse(auditData);
            if (parsed.id) {
              setPresentationId(parsed.id);
              setIsCreateMode(false);
              // Load categories from sessionStorage for update mode
              loadCategoriesFromStorage();
            } else {
              // No ID means we're in create mode - use sessionStorage data
              setIsCreateMode(true);
              loadCategoriesFromStorage();
            }
          } catch {
            setIsCreateMode(false);
          }
        } else {
          setIsCreateMode(false);
        }
      }
    }
  }, [editId]);

  // Listen for changes to auditData in sessionStorage (for both create and update mode)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    loadCategoriesFromStorage();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadCategoriesFromStorage();
    };
    
    // Listen for custom event when audit data is updated
    window.addEventListener('categoryNameUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('categoryNameUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch audit data to get categories (only if not available in sessionStorage)
  const hasSessionStorageData = typeof window !== 'undefined' && sessionStorage.getItem('auditData');
  const { data: auditData, isLoading: auditLoading } = useAudit(
    !hasSessionStorageData && presentationId ? presentationId : null
  );
  
  // Fetch summary data (only if not available in sessionStorage)
  const hasSummaryInStorage = typeof window !== 'undefined' && sessionStorage.getItem('summaryData');
  const summaryQuery = useSummary(
    !hasSummaryInStorage && presentationId ? presentationId : null
  );
  const summaryLoading = summaryQuery.isLoading;
  const summaryResponse = summaryQuery.data as { success: boolean; data: { summary: { categoryRecommendations?: Array<{ categoryId: string; recommendation: string }>; nextSteps?: NextStep[]; overallDetails?: string } | null; categories: Array<{ id: string; name: string }> } } | undefined;
  const summaryData = summaryResponse?.data;
  

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

  // Initialize data from sessionStorage (priority) or API (fallback)
  useEffect(() => {
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
          // Initialize empty for all categories if not in storage
          if (sessionStorageCategories.length > 0) {
            sessionStorageCategories.forEach((cat) => {
              if (!recs[cat.id]) {
                recs[cat.id] = "";
              }
            });
          }
          setCategoryRecommendations(recs);
          
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
          
          // If we loaded from sessionStorage, don't load from API
          return;
        } catch {}
      } else {
        // No summary data in sessionStorage - initialize empty for all categories
        if (sessionStorageCategories.length > 0) {
          const emptyRecs: Record<string, string> = {};
          sessionStorageCategories.forEach((cat) => {
            emptyRecs[cat.id] = "";
          });
          setCategoryRecommendations(emptyRecs);
        }
      }
    }
    
    // Fallback to API only if no sessionStorage data exists
    if (!isCreateMode && summaryData) {
      const { summary } = summaryData;
      
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
        if (summaryData.categories && Array.isArray(summaryData.categories)) {
          summaryData.categories.forEach((cat: { id: string }) => {
            if (!recs[cat.id]) {
              recs[cat.id] = "";
            }
          });
        }
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
      } else {
        // No summary exists - initialize empty for all categories
        if (summaryData.categories && Array.isArray(summaryData.categories)) {
          const emptyRecs: Record<string, string> = {};
          summaryData.categories.forEach((cat: { id: string }) => {
            emptyRecs[cat.id] = "";
          });
          setCategoryRecommendations(emptyRecs);
        }
      }
    }
  }, [summaryData, isCreateMode, sessionStorageCategories]);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      uploadData
    );
    return response.data.secure_url;
  };

  const openFilePicker = (index: number) => {
    setTimeout(() => {
      fileInputRefs.current[index]?.click();
    }, 50);
  };

  const handleImageChange = async (
    index: number,
    file: File | null,
    target?: HTMLInputElement
  ) => {
    if (file) {
      setUploading((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      
      try {
        const imageUrl = URL.createObjectURL(file);
        setImages((prev) => {
          const next = [...prev];
          next[index] = imageUrl;
          return next;
        });
        setSelections((prev) => {
          const next = [...prev];
          next[index] = "file";
          return next;
        });
        
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(file);
        setFileUrls((prev) => {
          const next = [...prev];
          next[index] = cloudinaryUrl;
          return next;
        });
        
        // Update nextSteps
        setNextSteps((prev) => {
          const next = [...prev];
          next[index] = { type: "file", content: "", fileUrl: cloudinaryUrl };
          return next;
        });
      } catch (error) {
        console.error("File upload failed:", error);
        toast.error("Failed to upload file");
      } finally {
        setUploading((prev) => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
      }
    }

    if (target) target.value = "";
  };

  const handleSelect = (index: number, type: NextStepType) => {
    if (type === "text") {
      setSelections((prev) => {
        const next = [...prev];
        next[index] = "text";
        return next;
      });
      setNextSteps((prev) => {
        const next = [...prev];
        next[index] = { type: "text", content: prev[index]?.content || "" };
        return next;
      });
    } else {
      openFilePicker(index);
    }
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
        next[index] = "text";
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

  // Auto-save summary data to sessionStorage (for both create and update mode)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      let categoryRecs: Array<{ categoryId: string; recommendation: string }> = [];
      
      if (isCreateMode) {
        // For create mode, use sessionStorage categories
        const categories = sessionStorageCategories.length > 0 
          ? sessionStorageCategories 
          : Array.from({ length: 7 }, (_, i) => ({
              id: `temp-${i}`,
              name: `Category ${i + 1}`,
            }));

        categoryRecs = categories.map((cat) => ({
          categoryId: cat.id,
          recommendation: categoryRecommendations[cat.id] || "",
        }));
      } else {
        // For update mode, use categories from sessionStorage (which have real IDs) or auditData
        if (sessionStorageCategories.length > 0) {
          // Use sessionStorage categories which have real IDs
          categoryRecs = sessionStorageCategories.map((cat) => ({
            categoryId: cat.id,
            recommendation: categoryRecommendations[cat.id] || "",
          }));
        } else if (auditData?.categories && auditData.categories.length > 0) {
          // Fallback to API categories
          categoryRecs = auditData.categories.map((cat) => ({
            categoryId: cat.id,
            recommendation: categoryRecommendations[cat.id] || "",
          }));
        }
      }

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
    } catch (error) {
      console.error("Error auto-saving summary to sessionStorage:", error);
    }
  }, [categoryRecommendations, nextSteps, selections, overallDetails, fileUrls, isCreateMode, sessionStorageCategories, auditData]);

  if (!isCreateMode && (auditLoading || summaryLoading)) {
    return (
      <div className="p-14 bg-white min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // if (!isCreateMode && (!presentationId || !auditData)) {
  //   return (
  //     <div className="p-14 bg-white min-h-screen flex items-center justify-center">
  //       <div className="text-xl text-red-500">Audit not found. Please go back and select an audit.</div>
  //     </div>
  //   );
  // }

  // Get categories from either API or sessionStorage
  const categories = isCreateMode 
    ? sessionStorageCategories.length > 0 
      ? sessionStorageCategories 
      : Array.from({ length: 7 }, (_, i) => ({
          id: `temp-${i}`,
          name: `Category ${i + 1}`,
        }))
    : (sessionStorageCategories.length > 0 ? sessionStorageCategories : (auditData?.categories || []));

  return (
    <div className=" px-10 p-6 bg-white min-h-screen">
      <div className="mb-4">
        <h1 className="text-[35px] leading-[39px] tracking-[0.21px] uppercase">
          Summary
        </h1>
      </div>
      <main className="mt-4">
        <hr className="w-full border border-[#AAA] my-[18px]" />
        <div className="flex flex-wrap lg:flex-nowrap">
          {/* Left Side */}
          <div className="w-full lg:w-1/2 pr-0 lg:pr-10">
            <h1 className="text-[35px] leading-[39px] tracking-[0.21px] uppercase mb-4">
              IMPROVEMENT RECOMMENDATIONS
            </h1>
            <div className="flex flex-col">
              {categories.map((category) => (
                <div className="mb-2" key={category.id}>
                  <label className="block text-xl text-[#2B4055] tracking-[0.4px] mb-1">
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
                    className="w-full h-[6.5vh] p-2 text-xl text-[#2B4055] tracking-[0.4px] font-extralight border border-[#AAA] rounded-lg resize-none outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="hidden lg:block w-px h-[80vh] border border-[#AAA] my-[18px]" />

          {/* Right Side */}
          <div className="w-full lg:w-1/2 pl-0 lg:pl-10 mt-10 lg:mt-0">
            <h1 className="text-[35px] leading-[39px] tracking-[0.21px] uppercase">
              WHAT ARE THE NEXT STEPS?
            </h1>

            <div className="bg-[#EFEFEF] p-6 rounded-2xl mt-10">
              {/* Top Boxes */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`flex-1 relative rounded-lg border transition-all duration-200 overflow-hidden ${
                      selections[index]
                        ? "border border-[#2B4055]"
                        : "border border-[#CCC]"
                    } bg-[#E8E8E8]`}
                    style={{ aspectRatio: "1" }}
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
                          className="w-full h-full p-3 text-lg text-[#2B4055] font-extralight border-none outline-none resize-none bg-white"
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
                          <div className="absolute top-1/4 left-28 -translate-x-1/3 -translate-y-1/2 flex items-center justify-center w-8 h-8">
                            <ImageIcon className="w-56 h-56 text-[#666]" />
                          </div>
                        </div>

                        <hr className="w-px h-[500px] border border-[#AAA] absolute rotate-45 top-1/2 left-[156px] -translate-x-1/3 -translate-y-1/2" />

                        <div
                          className="absolute inset-0 bg-[#E8E8E8]"
                          style={{
                            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                          }}
                          onClick={() => handleSelect(index, "text")}
                        >
                          <div className="absolute bottom-1/4 right-28 translate-x-1/3 translate-y-1/2 flex items-center justify-center w-8 h-8">
                            <Type className="w-56 h-56 text-[#666]" />
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

              <div className="mt-6">
                <textarea
                  value={overallDetails}
                  onChange={(e) => setOverallDetails(e.target.value)}
                  placeholder="Add overall next step details..."
                  className="w-full h-32 p-4 text-lg text-[#3b5163] border border-[#3b5163] rounded-lg resize-none outline-none bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
