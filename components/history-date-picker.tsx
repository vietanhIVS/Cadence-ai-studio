"use client";

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface HistoryDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  align?: 'start' | 'end';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function HistoryDatePicker({
  label,
  value,
  onChange,
  align = 'start',
}: HistoryDatePickerProps) {
  const [open, setOpen] = useState(false);

  // Initialize displayed month based on current value or today
  const initialDate = value && !isNaN(Date.parse(value)) ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Keep view aligned when opening if a value exists
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && value && !isNaN(Date.parse(value))) {
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    setOpen(nextOpen);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${m}-${d}`;
    onChange(dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  // Calculate days for the month grid
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="field history-datepicker-field flex-1 min-w-[130px]">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="history-datepicker-trigger flex h-[44px] w-full items-center justify-between rounded-xl border border-slate-200/90 bg-white/75 px-3 py-2 text-sm text-slate-800 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label={`${label} date: ${value || 'none selected'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className={`truncate text-sm ${value ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {value || 'YYYY-MM-DD'}
              </span>
            </div>
            {value && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Clear ${label} date`}
                className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange('');
                  }
                }}
              >
                <X size={13} />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={8}
          collisionPadding={16}
          className="history-datepicker-popover z-[60] w-[284px] max-w-[calc(100vw-32px)] rounded-2xl border border-white/80 bg-white/95 p-3 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-1 py-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1">
            {WEEKDAY_NAMES.map(w => (
              <div key={w} className="h-6 grid place-items-center">{w}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mStr = String(viewMonth + 1).padStart(2, '0');
              const dStr = String(day).padStart(2, '0');
              const dateStr = `${viewYear}-${mStr}-${dStr}`;
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 font-bold text-white shadow-sm shadow-blue-500/30'
                      : isToday
                      ? 'border border-blue-500/60 bg-blue-50/60 font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 font-medium py-1 px-1.5"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold py-1 px-1.5"
            >
              Today
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
