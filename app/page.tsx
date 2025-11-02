
'use client';

import { useUser } from '@/contexts/UserContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PresentationTable from '@/components/PresentationTable';
import QuestionTable from '@/components/QuestionTable';
import PresentationForm from '@/components/PresentationForm';
import CategoryForm from '@/components/CategoryForm';
import QuestionForm from '@/components/QuestionForm';
import { Presentation, Category, Question, TestResults } from '@/lib/types';
import { presentationApi, questionApi, testApi } from '@/lib/api';
import TestInterface from '@/components/TestInterface';
import TestResultsComponent from '@/components/TestResults';

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Selection states
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [refreshSidebar, setRefreshSidebar] = useState(0);

  // Form states
  const [showPresentationForm, setShowPresentationForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Test states
  const [showTestInterface, setShowTestInterface] = useState(false);
  const [testPresentation, setTestPresentation] = useState<Presentation | null>(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState<{
    totalScore: number;
    categoryScores: { [categoryId: string]: number };
  } | null>(null);

  useEffect(() => {
    // Manual authentication check
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (!data.authenticated) {
          router.push('/signin');
          return;
        }

        setIsLoading(false);
        loadData();
      } catch (error) {
        console.error(error);
        router.push('/signin');
      }
    };

    checkAuth();
  }, [router]);

  const loadData = async () => {
    try {
      const [presentationsData, questionsData] = await Promise.all([
        presentationApi.getAll(),
        questionApi.getAll(),
      ]);
      setPresentations(presentationsData);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handlePresentationSelect = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleCreatePresentation = () => {
    setEditingPresentation(null);
    setShowPresentationForm(true);
  };

  const handleCreateCategory = () => {
    if (!selectedPresentation) return;
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleCreateQuestion = () => {
    if (!selectedCategory) return;
    setEditingQuestion(null);
    setShowQuestionForm(true);
  };

  const handleEditPresentation = (presentation: Presentation) => {
    setEditingPresentation(presentation);
    setShowPresentationForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const handleDeletePresentation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this presentation?')) return;
    try {
      await presentationApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete presentation:', error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await questionApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowPresentationForm(false);
    setShowCategoryForm(false);
    setShowQuestionForm(false);
    setEditingPresentation(null);
    setEditingCategory(null);
    setEditingQuestion(null);
    loadData();
    setRefreshSidebar(prev => prev + 1); // Trigger sidebar refresh
  };

  const handleFormCancel = () => {
    setShowPresentationForm(false);
    setShowCategoryForm(false);
    setShowQuestionForm(false);
    setEditingPresentation(null);
    setEditingCategory(null);
    setEditingQuestion(null);
  };

  const handleStartPresentation = (presentation: Presentation) => {
    setTestPresentation(presentation);
    setShowTestInterface(true);
  };

  const handleTestComplete = async (results: TestResults) => {
    try {
      // Submit test to backend
      await testApi.submit({
        userId: user?.id || '',
        presentationId: testPresentation?.id || '',
        answers: results.answers.map((answer) => ({
          questionId: answer.questionId,
          optionId: answer.optionId,
        })),
      });

      setTestResults({
        totalScore: results.totalScore,
        categoryScores: results.categoryScores,
      });
      setShowTestInterface(false);
      setShowTestResults(true);
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
  };

  const handleTestCancel = () => {
    setShowTestInterface(false);
    setTestPresentation(null);
  };

  const handleResultsClose = () => {
    setShowTestResults(false);
    setTestResults(null);
    setTestPresentation(null);
  };

  const filteredQuestions = selectedCategory && Array.isArray(questions)
    ? questions.filter(q => q.categoryId === selectedCategory.id)
    : [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        key={refreshSidebar}
        selectedPresentation={selectedPresentation}
        selectedCategory={selectedCategory}
        onPresentationSelect={handlePresentationSelect}
        onCategorySelect={handleCategorySelect}
        onCreatePresentation={handleCreatePresentation}
        onCreateCategory={handleCreateCategory}
        onStartPresentation={handleStartPresentation}
      />

      <div className="flex-1 p-6">
        {!selectedPresentation ? (
          <PresentationTable
            presentations={presentations}
            onEdit={handleEditPresentation}
            onDelete={handleDeletePresentation}
          />
        ) : !selectedCategory ? (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setSelectedPresentation(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Presentations
              </button>
            </div>
            <PresentationTable
              presentations={[selectedPresentation]}
              onEdit={handleEditPresentation}
              onDelete={handleDeletePresentation}
            />
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  ← Back to Categories
                </button>
                <span className="text-gray-600">
                  {selectedPresentation.title} → {selectedCategory.name}
                </span>
              </div>
            </div>
            <QuestionTable
              questions={filteredQuestions}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteQuestion}
              onCreate={handleCreateQuestion}
            />
          </div>
        )}
      </div>

      {/* Forms */}
      {showPresentationForm && (
        <PresentationForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          initialData={editingPresentation ? { id: editingPresentation.id, title: editingPresentation.title } : undefined}
        />
      )}

      {showCategoryForm && selectedPresentation && (
        <CategoryForm
          presentationId={selectedPresentation.id}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          initialData={editingCategory ? { id: editingCategory.id, name: editingCategory.name } : undefined}
        />
      )}

      {showQuestionForm && selectedCategory && (
        <QuestionForm
          categoryId={selectedCategory.id}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          initialData={editingQuestion ? {
            id: editingQuestion.id,
            text: editingQuestion.text,
            options: editingQuestion.options.map(opt => ({
              id: opt.id,
              text: opt.text,
              points: opt.points,
            }))
          } : undefined}
        />
      )}

      {/* Test Interface */}
      {showTestInterface && testPresentation && (
        <TestInterface
          presentation={testPresentation}
          onComplete={handleTestComplete}
          onCancel={handleTestCancel}
        />
      )}

      {/* Test Results */}
      {showTestResults && testPresentation && testResults && (
        <TestResultsComponent
          presentation={testPresentation}
          totalScore={testResults.totalScore}
          categoryScores={testResults.categoryScores}
          onClose={handleResultsClose}
        />
      )}
    </div>
  );
}
