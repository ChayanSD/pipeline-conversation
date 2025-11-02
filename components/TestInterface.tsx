'use client';

import { useState, useEffect } from 'react';
import { Presentation, Question, Answer, TestResults, Test } from '@/lib/types';
import { testApi } from '@/lib/api';

interface TestInterfaceProps {
  presentation: Presentation;
  onComplete: (results: TestResults) => void;
  onCancel: () => void;
}

export default function TestInterface({
  presentation,
  onComplete,
  onCancel,
}: TestInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [presentation]);

  const loadQuestions = async () => {
    try {
      // Get all questions for this presentation's categories
      const allQuestions = await testApi.getQuestionsForPresentation(presentation.id);
      setQuestions(allQuestions);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateResults = (): TestResults => {
    const answers: Answer[] = [];
    let totalScore = 0;
    const categoryScores: { [categoryId: string]: number } = {};

    questions.forEach(question => {
      const selectedOptionId = selectedAnswers[question.id];
      if (selectedOptionId) {
        const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
        if (selectedOption) {
          const answer: Answer = {
            id: '', // Will be set by backend
            testId: '', // Will be set by backend
            test: {} as Test, // Will be set by backend
            questionId: question.id,
            question,
            optionId: selectedOption.id,
            option: selectedOption,
            points: selectedOption.points,
          };
          answers.push(answer);
          totalScore += selectedOption.points;

          // Add to category score
          const categoryId = question.categoryId;
          categoryScores[categoryId] = (categoryScores[categoryId] || 0) + selectedOption.points;
        }
      }
    });

    return { totalScore, categoryScores, answers };
  };

  const handleSubmit = async () => {
    const results = calculateResults();
    onComplete(results);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="text-center">Loading questions...</div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="text-center">
            <p className="mb-4">No questions available for this presentation.</p>
            <button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl mx-4 rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{presentation.title}</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {currentQuestion && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option.id}
                    className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAnswers[currentQuestion.id] === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.id}
                      checked={selectedAnswers[currentQuestion.id] === option.id}
                      onChange={() => handleAnswerSelect(option.id)}
                      className="mr-3"
                    />
                    <span className="text-gray-900">{option.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              Previous
            </button>

            {!isLastQuestion ? (
              <button
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestion?.id || '']}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswers[currentQuestion?.id || '']}
                className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}