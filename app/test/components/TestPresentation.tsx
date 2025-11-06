"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auditApi, testApi } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import toast from "react-hot-toast";
import { Presentation } from "@/lib/types";
import TableSkeleton from "../../add-new-audit/components/tableSkeleton";

interface QuestionWithCategory {
  id: string;
  text: string;
  categoryId: string;
  options: Array<{
    id: string;
    text: string;
    points: number;
  }>;
  category: {
    id: string;
    name: string;
    presentationId: string;
  };
}

export default function TestPresentation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presentationId = searchParams.get('presentationId');
  const currentCategory = parseInt(searchParams.get('category') || '1', 10);
  const { user } = useUser();
  
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [questions, setQuestions] = useState<QuestionWithCategory[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({}); // categoryId -> total score
  const [totalOverallScore, setTotalOverallScore] = useState<number>(0); // Overall score percentage (0-100)
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const primaryColor = user?.primaryColor || '#2B4055';
  // Fetch presentation and questions
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

    const fetchData = async () => {
      try {
        setLoading(true);
        const [auditData, questionsData] = await Promise.all([
          auditApi.getById(presentationId),
          testApi.getQuestionsForPresentation(presentationId)
        ]);
        
        setPresentation(auditData);
        setQuestions(questionsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load audit. Please try again.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [presentationId, router, searchParams]);

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
          // Add the points directly (options have points 0-4)
          scores[catId] = (scores[catId] || 0) + option.points;
        }
      }
    });

    setCategoryScores(scores);

    // Calculate overall score as average percentage across all categories
    const categoryPercentages: number[] = [];
    presentation.categories.forEach(cat => {
      const categoryQuestions = questions.filter(q => q.category.id === cat.id);
      if (categoryQuestions.length > 0) {
        const maxPossibleScore = categoryQuestions.length * 4; // Each question max 4 points
        const currentScore = scores[cat.id] || 0;
        const percentage = maxPossibleScore > 0 ? (currentScore / maxPossibleScore) * 100 : 0;
        categoryPercentages.push(percentage);
      }
    });

    const overallScore = categoryPercentages.length > 0
      ? Math.round(categoryPercentages.reduce((sum, p) => sum + p, 0) / categoryPercentages.length)
      : 0;
    setTotalOverallScore(overallScore);
  }, [answers, questions, presentation]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    if (!user || !presentationId) return;

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all ${unansweredQuestions.length} remaining questions`);
      return;
    }

    try {
      setSubmitting(true);
      const answerArray = Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        optionId
      }));

      const result = await testApi.submit({
        userId: user.id,
        presentationId,
        answers: answerArray
      });

      toast.success("Audit submitted successfully!");
      router.push(`/test/result?testId=${result.testId}`);
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error("Failed to submit audit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter questions by selected category
  const displayedQuestions = questions.filter(q => {
    if (!presentation?.categories) return false;
    const category = presentation.categories[currentCategory - 1];
    return category && q.category.id === category.id;
  });

  // Get current category and its score
  const currentCategoryData = presentation?.categories[currentCategory - 1];
  const currentCategoryScore = currentCategoryData ? (categoryScores[currentCategoryData.id] || 0) : 0;

  if (loading || !presentation) {
    return <TableSkeleton />;
  }

  return (
    <div className="h-screen flex flex-col">
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
                          className=" bg-[#E8E8E8] px-4 h-[3.5vh]  w-[30vw] border-[#3b5163] rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value=""></option>
                          {question.options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.text}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center align-middle w-16">
                        <span className={`px-3 py-1 rounded text-sm font-medium text-gray-900`}>
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
                    <td className="px-4 py-3 align-middle border-r border-[#E8E8E8] w-full">
                    </td>
                    <td className="border-r border-gray-300 px-4 py-1 align-middle">
                      <div className="w-full px-4 h-[3.5vh] border-[#E8E8E8] rounded-xl flex items-center justify-end">
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
          <div className=" grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Block 1: Low Score */}
            <div className="bg-red-100 border border-red-300 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Score: 0 - 40</h3>
              <p className="text-sm text-red-700">
                This score indicates significant areas for improvement. Review the responses and identify critical gaps that need immediate attention to enhance overall performance.
              </p>
            </div>

            {/* Block 2: Medium Score */}
            <div className="bg-orange-100 border border-orange-300 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">Score: 41 - 70</h3>
              <p className="text-sm text-orange-700">
                The audit shows good progress, but there are still areas that could be optimized for better performance. Focus on identified weaknesses to reach excellence.
              </p>
            </div>

            {/* Block 3: High Score */}
            <div className="bg-green-100 border border-green-300 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Score: 71 - 100</h3>
              <p className="text-sm text-green-700">
                Excellent results! The audit indicates strong performance and adherence to best practices. Continue maintaining these high standards across all categories.
              </p>
            </div>
          </div>

          {/* AUDIT TOTAL SCORE Progress Bar */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">AUDIT TOTAL SCORE</h3>
            <div className="relative w-full h-8 bg-gray-300 rounded-full overflow-hidden">
              {/* Dynamic colored fill */}
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                  totalOverallScore <= 40 ? 'bg-red-500' : 
                  totalOverallScore <= 70 ? 'bg-orange-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(totalOverallScore, 100)}%` }}
              >
                {/* Score label */}
                {totalOverallScore > 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-sm">
                    {totalOverallScore}%
                  </div>
                )}
              </div>
              {/* Score label for low scores (outside the bar) */}
              {totalOverallScore <= 5 && (
                <div className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-700 font-bold text-sm">
                  {totalOverallScore}%
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
