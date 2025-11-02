"use client";

import React, { useState } from 'react'

export default function AuditTable() {
  const [activeRows, setActiveRows] = useState<Set<number>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<{ [key: number]: string }>({});
  const [questions, setQuestions] = useState<{ [key: number]: string }>({});

  const handleQuestionClick = (rowIndex: number) => {
    setActiveRows(prev => {
      const newSet = new Set(prev);
      newSet.add(rowIndex);
      return newSet;
    });
  };

  const handleStatusClick = (rowIndex: number, status: string) => {
    setSelectedStatus(prev => ({
      ...prev,
      [rowIndex]: status
    }));
  };

  const handleQuestionChange = (rowIndex: number, value: string) => {
    setQuestions(prev => ({
      ...prev,
      [rowIndex]: value
    }));
  };

  const statusButtons = [
    { label: "Very Minimal", color: "bg-[#FFE2E380]", borderColor: "border-[#FFB7B9]", textColor: "text-pink-800" },
    { label: "Just Starting", color: "bg-[#FFFCE280]", borderColor: "border-[#E3D668]", textColor: "text-yellow-800" },
    { label: "Good progress", color: "bg-[#FFDBC2B2]", borderColor: "border-[#894B00E5]", textColor: "text-orange-800" },
    { label: "Excellent", color: "bg-[#DCFCE7]", borderColor: "border-[#01673099]", textColor: "text-green-800" },
  ];

  return (
    <div className="w-full mt-8">
      <table className="w-full border-collapse border border-gray-300">
        <tbody>
          {Array.from({ length: 10 }, (_, index) => {
            const rowIndex = index + 1;
            const isActive = activeRows.has(rowIndex);
            
            return (
              <tr key={rowIndex} className="border-b border-gray-300">
                {/* Column 1: Row Number */}
                <td className="border-r border-gray-300 px-4 py-3 text-center align-middle w-16">
                  <span className="text-gray-700">{rowIndex}</span>
                </td>
                
                {/* Column 2: Question Input */}
                <td className="border-r border-gray-300 px-4 py-3 align-middle w-1/2">
                  <input
                    type="text"
                    value={questions[rowIndex] || ''}
                    placeholder={`Question ${rowIndex.toString().padStart(2, '0')}`}
                    onClick={() => handleQuestionClick(rowIndex)}
                    onChange={(e) => handleQuestionChange(rowIndex, e.target.value)}
                    className="w-full bg-[#4569871A] px-4 py-2 border border-[#3b5163] rounded-[12px] outline-none"
                  />
                </td>
                
                {/* Column 3: Status Buttons (shown when active) */}
                <td className="border-r border-gray-300 px-4 py-3 align-middle">
                  {isActive && (
                    <div className="flex gap-2">
                      {statusButtons.map((button) => {
                        const isSelected = selectedStatus[rowIndex] === button.label;
                        return (
                          <button
                            key={button.label}
                            onClick={() => handleStatusClick(rowIndex, button.label)}
                            className={`${button.color} ${button.borderColor} ${button.textColor} px-3 py-1.5 rounded-lg border font-medium text-sm transition-all hover:scale-105 ${
                              isSelected ? 'ring-2  ring-gray-400' : ''
                            }`}
                          >
                            {button.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </td>
                
                {/* Column 4: Duplicate Row Number (shown when active) */}
                <td className="px-4 py-3 text-center align-middle w-16">
                  {isActive && (
                    <span className="text-gray-700">{rowIndex}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )
}
