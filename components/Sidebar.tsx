'use client';

import { useState, useEffect } from 'react';
import { Presentation, Category } from '@/lib/types';
import { presentationApi, categoryApi } from '@/lib/api';

interface SidebarProps {
  selectedPresentation: Presentation | null;
  selectedCategory: Category | null;
  onPresentationSelect: (presentation: Presentation) => void;
  onCategorySelect: (category: Category) => void;
  onCreatePresentation: () => void;
  onCreateCategory: () => void;
  onStartPresentation?: (presentation: Presentation) => void;
}

export default function Sidebar({
  selectedPresentation,
  selectedCategory,
  onPresentationSelect,
  onCategorySelect,
  onCreatePresentation,
  onCreateCategory,
  onStartPresentation,
}: SidebarProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresentations();
  }, []);

  useEffect(() => {
    if (selectedPresentation) {
      loadCategoriesForPresentation(selectedPresentation.id);
    } else {
      setCategories([]);
    }
  }, [selectedPresentation]);

  const loadPresentations = async () => {
    try {
      const data = await presentationApi.getAll();
      setPresentations(data);
    } catch (error) {
      console.error('Failed to load presentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesForPresentation = async (presentationId: string) => {
    try {
      const allCategories = await categoryApi.getAll();
      const filteredCategories = allCategories.filter(
        (cat) => cat.presentationId === presentationId
      );
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Presentations</h2>
          <button
            onClick={onCreatePresentation}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            +
          </button>
        </div>
        {selectedPresentation && onStartPresentation && (
          <div className="mb-3">
            <button
              onClick={() => onStartPresentation(selectedPresentation)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
            >
              Start Presentation
            </button>
          </div>
        )}
        <div className="space-y-1">
          {presentations.map((presentation) => (
            <button
              key={presentation.id}
              onClick={() => onPresentationSelect(presentation)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                selectedPresentation?.id === presentation.id
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {presentation.title}
            </button>
          ))}
        </div>
      </div>

      {selectedPresentation && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <button
              onClick={onCreateCategory}
              className="text-sm bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
            >
              +
            </button>
          </div>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedCategory?.id === category.id
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}