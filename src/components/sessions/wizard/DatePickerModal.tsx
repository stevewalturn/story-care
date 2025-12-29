'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

type DatePickerModalProps = {
  isOpen: boolean;
  selectedDate?: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DatePickerModal({ isOpen, selectedDate, onSelect, onClose }: DatePickerModalProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());

  if (!isOpen) return null;

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    // Adjust so Monday = 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    onSelect(date);
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day
      && selectedDate.getMonth() === currentMonth
      && selectedDate.getFullYear() === currentYear
    );
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
  const daysInPreviousMonth = getDaysInMonth(currentMonth - 1, currentYear);

  // Generate calendar days
  const calendarDays: Array<{ day: number; isCurrentMonth: boolean }> = [];

  // Previous month's trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPreviousMonth - i,
      isCurrentMonth: false,
    });
  }

  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
    });
  }

  // Next month's leading days (to fill the grid)
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Calendar Modal */}
      <div className="relative z-50 w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
        {/* Month/Year Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {MONTHS[currentMonth]}
              {' '}
              {currentYear}
            </span>
            <button className="rounded p-1 hover:bg-gray-100">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleNextMonth}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Day Labels */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS.map(day => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dateObj, idx) => {
            const isSelected = dateObj.isCurrentMonth && isSelectedDate(dateObj.day);

            return (
              <button
                key={idx}
                onClick={() => {
                  if (dateObj.isCurrentMonth) {
                    handleDateClick(dateObj.day);
                  }
                }}
                disabled={!dateObj.isCurrentMonth}
                className={`
                  flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors
                  ${dateObj.isCurrentMonth ? 'text-gray-900 hover:bg-gray-100' : 'text-gray-300'}
                  ${isSelected ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
                  ${!dateObj.isCurrentMonth ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                {dateObj.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
