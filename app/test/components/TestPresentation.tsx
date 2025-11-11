"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAudit, useTestQuestions, useSubmitTest } from "@/lib/hooks";
import { useUser } from "@/contexts/UserContext";
import toast from "react-hot-toast";
import Image from "next/image";
import TableSkeleton from "../../add-new-audit/components/tableSkeleton";
import { Category, Presentation } from "@/lib/types";

export default function TestPresentation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presentationId = searchParams.get('presentationId');
  const currentCategory = parseInt(searchParams.get('category') || '1', 10);
  const { user } = useUser();
  
  const { data: auditData, isLoading: auditLoading, error: auditError } = useAudit(presentationId);
  const { data: questionsData, isLoading: questionsLoading, error: questionsError } = useTestQuestions(presentationId);
  const submitTestMutation = useSubmitTest();
  
  // Get summary data from audit data (summary is included in the API response)
  const summaryData = auditData && 'summary' in auditData 
    ? (auditData as Presentation & { summary?: { categoryRecommendations?: string | Array<{ categoryId: string; recommendation: string }>; nextSteps?: string | Array<{ type: string; content: string; fileUrl?: string }>; overallDetails?: string | null } | null })?.summary || null
    : null;
  
  // Load answers from localStorage on mount
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined' || !presentationId) return {};
    try {
      const savedAnswers = localStorage.getItem(`testAnswers:${presentationId}`);
      return savedAnswers ? JSON.parse(savedAnswers) : {};
    } catch (error) {
      console.error("Error loading answers from localStorage:", error);
      return {};
    }
  }); // questionId -> optionId
  
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined' || !presentationId) return {};
    try {
      const savedScores = localStorage.getItem(`testCategoryScores:${presentationId}`);
      return savedScores ? JSON.parse(savedScores) : {};
    } catch (error) {
      console.error("Error loading category scores from localStorage:", error);
      return {};
    }
  }); // categoryId -> total score
  const primaryColor = user?.primaryColor || '#2B4055';

  // Handle routing and category parameter
  useEffect(() => {
    if (!presentationId) {
      toast.error("Presentation ID is missing");
      router.push("/");
      return;
    }

    // Ensure category parameter is in URL
    if (!searchParams.get('category')) {
      router.replace(`/test?presentationId=${presentationId}&category=1`);
      return;
    }

    // Reload answers from localStorage when presentationId changes
    if (typeof window !== 'undefined' && presentationId) {
      try {
        const savedAnswers = localStorage.getItem(`testAnswers:${presentationId}`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        } else {
          setAnswers({});
        }
        
        const savedScores = localStorage.getItem(`testCategoryScores:${presentationId}`);
        if (savedScores) {
          setCategoryScores(JSON.parse(savedScores));
        } else {
          setCategoryScores({});
        }
      } catch (error) {
        console.error("Error loading test data from localStorage:", error);
        setAnswers({});
        setCategoryScores({});
      }
    }
  }, [presentationId, router, searchParams]);

  // Store category names and audit data in sessionStorage when audit data is loaded
  useEffect(() => {
    if (auditData && typeof window !== 'undefined' && auditData.categories) {
      // Store category names
      auditData.categories.forEach((category, index) => {
        const categoryNumber = index + 1;
        if (category.name) {
          sessionStorage.setItem(`auditData:categoryName:${categoryNumber}`, category.name);
        }
      });
      
      // Store audit data structure for sidebar to count categories
      const auditDataForStorage = {
        id: auditData.id,
        title: auditData.title,
        categories: auditData.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          questions: cat.questions || [],
        })),
      };
      sessionStorage.setItem('auditData', JSON.stringify(auditDataForStorage));
      
      // Dispatch event to update sidebar
      window.dispatchEvent(new Event('categoryNameUpdated'));
    }
  }, [auditData]);

  // Store summary data in sessionStorage when it's loaded from audit data
  useEffect(() => {
    if (summaryData && typeof window !== 'undefined') {
      try {
        const summaryToStore = {
          categoryRecommendations: summaryData.categoryRecommendations
            ? (typeof summaryData.categoryRecommendations === 'string'
                ? JSON.parse(summaryData.categoryRecommendations)
                : summaryData.categoryRecommendations)
            : [],
          nextSteps: summaryData.nextSteps
            ? (typeof summaryData.nextSteps === 'string'
                ? JSON.parse(summaryData.nextSteps)
                : summaryData.nextSteps)
            : [],
          overallDetails: summaryData.overallDetails || "",
        };
        sessionStorage.setItem('summaryData', JSON.stringify(summaryToStore));
      } catch (error) {
        console.error("Error storing summary data in sessionStorage:", error);
      }
    }
  }, [summaryData]);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && presentationId && Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(`testAnswers:${presentationId}`, JSON.stringify(answers));
      } catch (error) {
        console.error("Error saving answers to localStorage:", error);
      }
    }
  }, [answers, presentationId]);

  // Save category scores to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && presentationId && Object.keys(categoryScores).length > 0) {
      try {
        localStorage.setItem(`testCategoryScores:${presentationId}`, JSON.stringify(categoryScores));
      } catch (error) {
        console.error("Error saving category scores to localStorage:", error);
      }
    }
  }, [categoryScores, presentationId]);

  // Handle errors
  useEffect(() => {
    if (auditError || questionsError) {
      toast.error("Failed to load audit. Please try again.");
      router.push("/");
    }
  }, [auditError, questionsError, router]);

  const loading = auditLoading || questionsLoading;
  const presentation = auditData || null;
  
  // Memoize questions to prevent unnecessary re-renders
  const questions = useMemo(() => questionsData || [], [questionsData]);

  // Calculate category scores when answers change
  useEffect(() => {
    if (questions.length === 0 || !presentation) return;

    const scores: Record<string, number> = {};

    // Initialize all category scores to 0
    presentation.categories.forEach(cat => {
      scores[cat.id] = 0;
    });

    // Calculate score for each category
    questions.forEach(q => {
      const selectedOptionId = answers[q.id];
      if (selectedOptionId) {
        const option = q.options.find(opt => opt.id === selectedOptionId);
        if (option) {
          const catId = q.category.id;
          // Add the points directly (options have points 1-5)
          scores[catId] = (scores[catId] || 0) + option.points;
        }
      }
    });

    setCategoryScores(scores);
  }, [answers, questions, presentation]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Note: handleSubmit is kept for potential future use or manual submission
  // Currently, test submission may be handled automatically or through navigation
  const handleSubmit = async () => {
    if (!user || !presentationId) return;

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all ${unansweredQuestions.length} remaining questions`);
      return;
    }

    try {
      const answerArray = Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        optionId
      }));

      const result = await submitTestMutation.mutateAsync({
        userId: user.id,
        presentationId,
        answers: answerArray
      });

      // Clear localStorage after successful submission
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(`testAnswers:${presentationId}`);
          localStorage.removeItem(`testCategoryScores:${presentationId}`);
        } catch (error) {
          console.error("Error clearing localStorage:", error);
        }
      }

      toast.success("Audit submitted successfully!");
      router.push(`/test/result?testId=${result.testId}`);
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error("Failed to submit audit. Please try again.");
    }
  };

  // Suppress unused variable warning - function may be used in future or via ref
  void handleSubmit;

  // Filter questions by selected category
  const displayedQuestions = questions.filter(q => {
    if (!presentation?.categories) return false;
    const category = presentation.categories[currentCategory - 1];
    return category && q.category.id === category.id;
  });

  // Get current category and its score
  const currentCategoryData = presentation?.categories[currentCategory - 1];
  const currentCategoryScore = currentCategoryData ? (categoryScores[currentCategoryData.id] || 0) : 0;
  
  // Calculate max score for current category
  const getCategoryMaxScore = (categoryId: string): number => {
    if (!questions.length) return 0;
    const questionCount = questions.filter(q => q.category.id === categoryId).length;
    return questionCount * 5; // Each question can score 1-5
  };

  const currentCategoryMaxScore = currentCategoryData ? getCategoryMaxScore(currentCategoryData.id) : 0;

  if (loading || !presentation) {
    return <TableSkeleton />;
  }

  // Calculate percentage for each category based on its max score
  const getCategoryPercentage = (categoryId: string): number => {
    const score = categoryScores[categoryId] || 0;
    const maxScore = getCategoryMaxScore(categoryId);
    if (maxScore === 0) return 0;
    return Math.min((score / maxScore) * 100, 100);
  };

  // Circular Progress Component
  const CircularProgress = ({ percentage, score, label }: { percentage: number; score: number; label: string }) => {
    const size = 80;
    const center = size / 2;
    const radius = 32; // Adjusted to fit nicely in 80px circle
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
          <svg 
            className="transform -rotate-90" 
            width={size} 
            height={size}
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#2B4055"
              strokeWidth="3"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#2CD573"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </svg>
          {/* Score in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#2d3e50] font-semibold" style={{ fontSize: '36px', lineHeight: '1' }}>
              {score}
            </span>
          </div>
        </div>
        {/* Category label */}
        <p className="mt-2 text-xs text-[#2d3e50] text-center font-medium  leading-tight">
          {label}
        </p>
      </div>
    );
  };
const filteredCategories = (categories: Presentation['categories']): Category[] => {
  return categories.filter((category: Category) => category.name.toLowerCase() !== 'summary');
};

  return (
    <div className="h-screen flex flex-col">
      <header className="">
        {/* Category Progress Circles */}
        {presentation && presentation.categories.length > 0 && (
          <div className="bg-white pt-2 grid grid-cols-8 gap-6 w-full ">
            {filteredCategories(presentation.categories)?.map((category) => {
              const categoryScore = categoryScores[category.id] || 0;
              const percentage = getCategoryPercentage(category.id);
              return (
                <CircularProgress
                  key={category.id}
                  percentage={percentage}
                  score={categoryScore}
                  label={category.name.toUpperCase()}
                />
              );
            })}
            {/* Summary Icon */}
            <div 
              className="flex flex-col items-center ml-4 cursor-pointer"
              onClick={() => {
                if (typeof window !== 'undefined' && presentationId && presentation) {
                  // Calculate current scores from answers
                  const scores: Record<string, number> = {};
                  presentation.categories.forEach(cat => {
                    scores[cat.id] = 0;
                  });

                  questions.forEach(q => {
                    const selectedOptionId = answers[q.id];
                    if (selectedOptionId) {
                      const option = q.options.find(opt => opt.id === selectedOptionId);
                      if (option) {
                        const catId = q.category.id;
                        scores[catId] = (scores[catId] || 0) + option.points;
                      }
                    }
                  });

                  // Filter out summary category
                  const nonSummaryCategories = presentation.categories.filter(
                    cat => cat.name.toLowerCase() !== 'summary'
                  );

                  // Calculate total score (excluding summary)
                  const totalScore = nonSummaryCategories.reduce((sum, cat) => {
                    return sum + (scores[cat.id] || 0);
                  }, 0);

                  // Store category names and scores in sessionStorage (excluding summary)
                  const testResultData = {
                    totalScore,
                    categoryScores: nonSummaryCategories.map(cat => {
                      const categoryQuestions = questions.filter(q => q.category.id === cat.id);
                      return {
                        categoryId: cat.id,
                        categoryName: cat.name,
                        score: scores[cat.id] || 0,
                        maxScore: categoryQuestions.length * 5,
                      };
                    }),
                  };
                  sessionStorage.setItem('testResultData', JSON.stringify(testResultData));
                  
                  // Store category names
                  presentation.categories.forEach((category, index) => {
                    const categoryNumber = index + 1;
                    if (category.name) {
                      sessionStorage.setItem(`auditData:categoryName:${categoryNumber}`, category.name);
                    }
                  });

                  // Dispatch events to update sidebar
                  window.dispatchEvent(new Event('categoryNameUpdated'));
                  window.dispatchEvent(new Event('testResultUpdated'));

                  // Navigate to result page
                  router.push(`/test/result?presentationId=${presentationId}`);
                }
              }}
            >
              <div className="w-24 h-24 flex items-center justify-center">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#F7AF41" />
                  <path
                    d="M12 8V12M12 16H12.01"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="mt-2 text-xs text-[#2d3e50] text-center font-medium max-w-[100px] leading-tight">
                SUMMARY OVERVIEW
              </p>
            </div>
          </div>
        )}

        <div className="bg-white flex items-center justify-center gap-2.5 w-full ">
          <p className="text-[17px] uppercase font-500 tracking-[0.352px] leading-normal font-medium">GRADING SCALE (1-5)</p>
          <div className="grid grid-cols-3 gap-[1.89px]">
            <p className="w-full text-[17px] uppercase font-medium bg-[#F65355] px-[38px] py-1.5 text-white rounded-tl-xl">
              1-2 URGENT ATTEN
            </p>
            <p className="w-full text-[17px] uppercase font-medium bg-[#F7AF41] px-[38px] py-1.5 text-white ">
              3-4 AVERAGE AUDIT
            </p>
            <p className="w-full text-[17px] uppercase font-medium bg-[#209150] px-[38px] py-1.5 text-white rounded-tr-xl">
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
      <main className="px-24 pt-3 bg-white flex-1 pb-10 overflow-y-auto">
        <div className="">
          <div className="w-full">
            <table className="w-full border-collapse  border-gray-300">
              <tbody>
                {displayedQuestions.map((question, index) => {
                  const selectedOptionId = answers[question.id];
                  const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
                  const score = selectedOption ? selectedOption.points : 0;
                  
                  return (
                    <tr key={question.id} className="border-b border-r border-[#E8E8E8]">
                      <td className="border-r border-gray-300 px-4  text-center align-middle w-16">
                        <span className="text-gray-700">{index + 1}</span>
                      </td>
                      <td className=" px-4  align-middle border-r border-[#E8E8E8] w-full">
                        <div className="w-full  px-4 h-[3vh] border-[#E8E8E8] rounded-xl flex items-center">
                          <span className="text-gray-900">{question.text}</span>
                        </div>
                      </td>
                      <td className="border-r  border-gray-300 px-4 align-middle">
                        <select
                          value={selectedOptionId || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className=" bg-[#E8E8E8] px-4 h-[2.8vh] w-[30vw] border-[#3b5163] rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value=""></option>
                          {question.options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.text}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center align-middle w-16">
                        <span className={`px-3 rounded text-sm font-medium text-gray-900`}>
                          {score > 0 ? score : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Total Score Row */}
                {currentCategoryData && (
                  <tr className=" border-r border-[#E8E8E8] ">
                    <td className="border-r border-gray-300 px-4 py-1 text-center align-middle w-16">
                    </td>
                    <td className="px-4 py-2 align-middle border-r border-[#E8E8E8] w-full">
                    </td>
                    <td className="border-r border-gray-300 px-4 py-1 align-middle">
                      <div className="w-full px-4 h-[2.8vh] border-[#E8E8E8] rounded-xl flex items-center justify-end">
                        <span className="text-gray-50 rounded-lg p-1 px-2 font-semibold " style={{backgroundColor: primaryColor}}>Total Score</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle w-16">
                      <span className="px-3 py-1 rounded text-sm font-bold text-gray-900">
                        {currentCategoryScore}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Score Interpretation Blocks */}
          {currentCategoryData && currentCategoryMaxScore > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-0">
              {/* Block 1: Low Score */}
              <div className="bg-white rounded-tl-xl  border-r-2  border-white ">
                <div 
                  className={`rounded-tl-xl text-center py-1 ${
                    currentCategoryScore >= 1 && currentCategoryScore <= Math.floor(currentCategoryMaxScore * 0.4)
                      ? 'bg-[#F65355] text-white' 
                      : 'bg-[#E8E8E8] text-gray-800'
                  }`}
                >
                  <h3 className="text-base font-semibold">Score: 1 - {Math.floor(currentCategoryMaxScore * 0.4)}</h3>
                </div>
                <div className="mt-3">
                  <p className="text-sm px-4 border-r-2 border-gray-200 text-gray-700 leading-relaxed">
                  This score range indicates areas that require urgent attention and immediate improvement. Critical gaps have been identified that need to be addressed as a priority to enhance overall performance and compliance.
                  </p>
                </div>
              </div>

              {/* Block 2: Medium Score */}
              <div className="bg-white">
                <div 
                  className={`text-center py-1 ${
                    currentCategoryScore > Math.floor(currentCategoryMaxScore * 0.4) && currentCategoryScore <= Math.floor(currentCategoryMaxScore * 0.8)
                      ? 'bg-[#F7AF41] text-white' 
                      : 'bg-[#E8E8E8] text-gray-800'
                  }`}
                >
                  <h3 className="text-base font-semibold">Score: {Math.floor(currentCategoryMaxScore * 0.4) + 1} - {Math.floor(currentCategoryMaxScore * 0.8)}</h3>
                </div>
                <div className="mt-3">
                  <p className="text-sm px-4 text-gray-700 leading-relaxed">
                  This score range represents average performance with room for enhancement. While basic standards are met, there are opportunities to strengthen processes and achieve better outcomes through targeted improvements.
                    </p>
                </div>
              </div>

              {/* Block 3: High Score */}
              <div className="bg-white">
                <div 
                  className={`text-center py-1 rounded-tr-xl border-l-2 border-white ${
                    currentCategoryScore > Math.floor(currentCategoryMaxScore * 0.8)
                      ? 'bg-[#2BD473] text-white' 
                      : 'bg-[#E8E8E8] text-gray-800'
                  }`}
                >
                  <h3 className="text-base font-semibold">Score: {Math.floor(currentCategoryMaxScore * 0.8) + 1} - {currentCategoryMaxScore}</h3>
                </div>
                <div className="mt-3 border-l-2 border-gray-200">
                  <p className="text-sm px-4 text-gray-700 leading-relaxed">
                  This score range demonstrates excellent performance and strong compliance. The category shows outstanding results with well-established processes and best practices in place.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Category Score Progress Bar */}
          {currentCategoryData && currentCategoryMaxScore > 0 && (
            <div className="mt-4 pt-2 px-4 pb-6 bg-[#D8DEE2] relative">
              <h3 className="text-base font-semibold text-gray-800 mb-3 uppercase">
                {currentCategoryData.name.toUpperCase()} SCORE ({currentCategoryScore} / {currentCategoryMaxScore})
              </h3>
              <div className="relative w-full h-4 flex items-center">
                {/* Red section - 0-40% of score (top layer) */}
                <div className="absolute inset-y-0 left-0 h-4 bg-[#F65355] rounded-full z-20" style={{ width: '33.33%', borderRadius: '9999px 0 0 9999px' }}></div>
                {/* Yellow section - 40-80% of score (middle layer) */}
                <div className="absolute inset-y-0 h-4 bg-[#F7AF41] z-10" style={{ left: '33.33%', width: '33.33%' }}></div>
                {/* Green section - 80-100% of score (last 20% of max value) (bottom layer) */}
                <div className="absolute inset-y-0 h-4 bg-[#2BD473] z-0" style={{ left: '66.66%', width: '33.33%', borderRadius: '0 9999px 9999px 0' }}></div>
                {/* Score indicator circle */}
                <div
                  className="absolute transition-all duration-500 z-30"
                  style={{ 
                    left: `${Math.min((currentCategoryScore / currentCategoryMaxScore) * 100, 100)}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="">
                    <div className="w-12 z-30 h-10 bg-[#456987] rounded-2xl flex items-center justify-center  shadow-lg">
                      <span className="text-white font-bold text-sm">{currentCategoryScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

         
        </div>
      </main>
    </div>
  );
}
