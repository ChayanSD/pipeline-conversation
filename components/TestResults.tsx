'use client';

import { Presentation } from '@/lib/types';

interface TestResultsProps {
  presentation: Presentation;
  totalScore: number;
  categoryScores: { [categoryId: string]: number };
  onClose: () => void;
}

export default function TestResults({
  presentation,
  totalScore,
  categoryScores,
  onClose,
}: TestResultsProps) {
  const getCategoryName = (categoryId: string) => {
    const category = presentation.categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl mx-4 rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Test Results</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{presentation.title}</h3>
            <div className="text-center">
              <div className={`inline-block px-6 py-3 rounded-lg ${getScoreBgColor(totalScore)}`}>
                <div className="text-3xl font-bold text-gray-900">{totalScore}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4">Category Breakdown</h4>
            <div className="space-y-3">
              {Object.entries(categoryScores).map(([categoryId, score]) => (
                <div key={categoryId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{getCategoryName(categoryId)}</span>
                  <span className={`font-bold ${getScoreColor(score)}`}>{score} points</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Close Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}