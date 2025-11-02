'use client';

import { useState } from 'react';
import { questionApi } from '@/lib/api';

interface Option {
  id?: string;
  text: string;
  points: number;
}

interface QuestionFormProps {
  categoryId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id?: string;
    text: string;
    options: Option[];
  };
}

export default function QuestionForm({
  categoryId,
  onSuccess,
  onCancel,
  initialData,
}: QuestionFormProps) {
  const [text, setText] = useState(initialData?.text || '');
  const [options, setOptions] = useState<Option[]>(
    initialData?.options || [{ text: '', points: 0 }, { text: '', points: 0 }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    setOptions([...options, { text: '', points: 0 }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof Option, value: string | number) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate options
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (initialData?.id) {
        // Update existing question
        await questionApi.update(initialData.id, {
          text,
          options: validOptions.map(opt => ({
            id: opt.id,
            text: opt.text,
            points: opt.points,
          })),
        });
      } else {
        // Create new question
        await questionApi.create({
          text,
          categoryId,
          options: validOptions,
        });
      }
      onSuccess();
    } catch (err) {
      setError('Failed to save question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-96 overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {initialData ? 'Edit Question' : 'Create New Question'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your question"
                rows={3}
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Option
                </button>
              </div>

              {options.map((option, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={`Option ${index + 1}`}
                  />
                  <input
                    type="number"
                    value={option.points}
                    onChange={(e) => updateOption(index, 'points', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Points"
                    min="0"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}