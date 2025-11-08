"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import toast from "react-hot-toast";
import TableSkeleton from "../../../add-new-audit/components/tableSkeleton";

export default function TestResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presentationId = searchParams.get('presentationId');
  const { user } = useUser();
  
  const [resultData, setResultData] = useState<{
    totalScore: number;
    categoryScores: Array<{
      categoryId: string;
      categoryName: string;
      score: number;
      maxScore: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const primaryColor = user?.primaryColor || '#2B4055';

  useEffect(() => {
    if (!presentationId) {
      toast.error("Presentation ID is missing");
      router.push("/");
      return;
    }

    // Load data from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('testResultData');
        if (stored) {
          const data = JSON.parse(stored);
          setResultData(data);
        } else {
          toast.error("No test data found. Please answer some questions first.");
          router.push(`/test?presentationId=${presentationId}&category=1`);
          return;
        }
      } catch (error) {
        console.error("Error loading test result:", error);
        toast.error("Failed to load test result. Please try again.");
        router.push(`/test?presentationId=${presentationId}&category=1`);
      } finally {
        setLoading(false);
      }
    }
  }, [presentationId, router]);

  if (loading || !resultData) {
    return <TableSkeleton />;
  }

  // Calculate total max score
  const totalMaxScore = resultData.categoryScores.reduce((sum, cs) => {
    return sum + cs.maxScore;
  }, 0);

  // Get category scores with percentages
  const categoryScoresWithData = resultData.categoryScores.map(cs => {
    const percentage = cs.maxScore > 0 ? (cs.score / cs.maxScore) * 100 : 0;
    return {
      ...cs,
      percentage,
    };
  });

  // Sort by score (lowest first for "Area Of Urgent Focus")
  const urgentFocusCategories = [...categoryScoresWithData].sort((a, b) => {
    const aPercentage = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
    const bPercentage = b.maxScore > 0 ? (b.score / b.maxScore) * 100 : 0;
    return aPercentage - bPercentage;
  }).slice(0, 3);

  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* SUMMARY SCORE Section */}
          <div className="mb-12 relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  SUMMARY SCORE YOUR SALES CONVERSION SCORE
                </h1>
                <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
                  Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim
                </p>
              </div>
              {/* Score Badge */}
              <div className="shrink-0 ml-8">
                <div 
                  className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                  style={{ borderColor: '#F65355' }}
                >
                  <span className="text-4xl font-bold" style={{ color: '#F65355' }}>
                    {resultData.totalScore}
                  </span>
                </div>
              </div>
            </div>

            {/* AUDIT TOTAL SCORE Progress Bar */}
            <div className="mt-8 pt-4 px-4 pb-6 bg-[#D8DEE2] relative rounded-lg">
              <h3 className="text-base font-semibold text-gray-800 mb-3 uppercase">
                AUDIT TOTAL SCORE ({resultData.totalScore} / {totalMaxScore})
              </h3>
              <div className="relative w-full h-4 flex items-center rounded-full overflow-hidden">
                {/* Red section - 0-33.33% */}
                <div className="absolute inset-y-0 left-0 h-4 bg-[#F65355] z-20" style={{ width: '33.33%' }}></div>
                {/* Yellow section - 33.33-66.66% */}
                <div className="absolute inset-y-0 h-4 bg-[#F7AF41] z-10" style={{ left: '33.33%', width: '33.33%' }}></div>
                {/* Green section - 66.66-100% */}
                <div className="absolute inset-y-0 h-4 bg-[#2BD473] z-0" style={{ left: '66.66%', width: '33.34%' }}></div>
                {/* Score indicator circle */}
                <div
                  className="absolute transition-all duration-500 z-30"
                  style={{ 
                    left: `${totalMaxScore > 0 ? Math.min((resultData.totalScore / totalMaxScore) * 100, 100) : 0}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="w-12 z-30 h-10 bg-[#456987] rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">{resultData.totalScore}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL BREAKDOWN RESULTS Section */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              VISUAL BREAKDOWN RESULTS
            </h2>
            <div className="flex flex-wrap gap-4 mb-6">
              {categoryScoresWithData.map((cs, index) => {
                const colors = [
                  { bg: '#209150', text: 'white' },
                  { bg: '#F7AF41', text: 'white' },
                  { bg: '#F65355', text: 'white' },
                  { bg: '#2BD473', text: 'white' },
                ];
                const color = colors[index % colors.length];
                return (
                  <div
                    key={cs.categoryId}
                    className="px-6 py-3 rounded-lg font-semibold uppercase text-sm"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {cs.categoryName}
                  </div>
                );
              })}
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lob nonummy nibh euismod incidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad
            </p>
          </div>

          {/* IMPROVEMENT RECOMMENDATIONS Section */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              IMPROVEMENT RECOMMENDATIONS
            </h2>
            <div className="space-y-6">
              {urgentFocusCategories.map((cs) => (
                <div key={cs.categoryId} className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {cs.categoryName}:
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* WHAT ARE THE NEXT STEPS? Section */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              WHAT ARE THE NEXT STEPS?
            </h2>
            <div className="space-y-4 mb-6">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-left text-gray-700 hover:border-gray-400 transition-colors"
                >
                  Enter step {step} details
                </button>
              ))}
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lob nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper
            </p>
          </div>

          {/* Want to Skip the Line? Section */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Want to Skip the Line?
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6 max-w-4xl">
              For action-takers ready to eliminate their conversion leaks immediately, schedule a strategy call. We&apos;ll map out how your personalized Pipeline Conversion Kit could look-so you can start closing confidently without rewriting your offer
            </p>
            <button
              className="px-8 py-4 bg-[#F7AF41] text-white font-semibold rounded-lg hover:bg-[#F7AF41]/90 transition-colors"
            >
              Book Your Call Now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

