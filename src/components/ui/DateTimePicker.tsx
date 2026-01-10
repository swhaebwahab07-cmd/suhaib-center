"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Format date for display (YYYY-MM-DD)
function formatDisplayDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
}


export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  style,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize today to prevent infinite loops
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Initialize selected date and current month from value
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (value) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    return null;
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearPicker(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Reset year picker when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowYearPicker(false);
    }
  }, [isOpen]);

  // Update selected date and current month when value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      setSelectedDate(date);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    } else {
      setSelectedDate(null);
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  }, [value, today]);

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    newDate.setHours(0, 0, 0, 0);
    
    // Only allow future dates or today
    const todayTime = today.getTime();
    const newDateTime = newDate.getTime();
    if (newDateTime >= todayTime) {
      setSelectedDate(newDate);
      // Return date in ISO format
      onChange(newDate.toISOString());
      setIsOpen(false);
    }
  };

  const handleYearSelect = (year: number) => {
    const newMonth = new Date(year, currentMonth.getMonth(), 1);
    setCurrentMonth(newMonth);
    setShowYearPicker(false);
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      // Don't allow going to past months
      const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const newMonthTime = newMonth.getTime();
      const todayMonthTime = todayMonth.getTime();
      if (newMonthTime >= todayMonthTime) {
        setCurrentMonth(newMonth);
      }
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }
  };


  const displayValue = value ? formatDisplayDate(value) : "";
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long" });

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonthIndex + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const days: (number | null)[] = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // Generate year options (current year to 10 years ahead)
  const years: number[] = [];
  const currentYearNum = today.getFullYear();
  for (let year = currentYearNum; year <= currentYearNum + 10; year++) {
    years.push(year);
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm text-left bg-white border border-gray-300 shadow-sm transition-all duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400/30 focus-within:border-sky-400 cursor-pointer flex items-center gap-2 ${className}`}
        style={style}
      >
        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className={`flex-1 ${displayValue ? "text-gray-900" : "text-gray-400"}`}>
          {displayValue || placeholder}
        </span>
      </div>

      {/* Calendar Popup - Centered */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => {
              setIsOpen(false);
              setShowYearPicker(false);
            }}
          />
          {/* Calendar Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 w-[340px] p-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            {!showYearPicker ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleMonthChange("prev")}
                  disabled={currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth()}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowYearPicker(true)}
                  className="flex items-center gap-2 flex-1 justify-center px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base font-semibold text-gray-900">
                    {monthName}
                  </span>
                  <span className="text-base font-semibold text-gray-700">
                    {currentYear}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMonthChange("next")}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowYearPicker(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Back to calendar"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="text-base font-semibold text-gray-900 flex-1 text-center">
                  Select Year
                </span>
                <div className="w-9" /> {/* Spacer for alignment */}
              </div>
            )}
          </div>

          {showYearPicker ? (
            /* Year Picker Grid */
            <div className="grid grid-cols-4 gap-2">
              {years.map((year) => {
                const isCurrentYear = year === currentYear;
                const isTodayYear = year === today.getFullYear();
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isCurrentYear
                        ? "bg-sky-500 text-white font-semibold shadow-md"
                        : isTodayYear
                        ? "bg-sky-100 text-sky-700 font-semibold border-2 border-sky-300"
                        : "text-gray-700 hover:bg-gray-100 hover:scale-105 active:scale-95"
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5 mb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-xs font-semibold text-gray-600 text-center py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const date = new Date(currentYear, currentMonthIndex, day);
                  date.setHours(0, 0, 0, 0);
                  const dateTime = date.getTime();
                  const todayTime = today.getTime();
                  const isToday = dateTime === todayTime;
                  const isSelected = selectedDate ? dateTime === selectedDate.getTime() : false;
                  const isPast = dateTime < todayTime;
                  const isDisabled = isPast;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      disabled={isDisabled}
                      className={`aspect-square text-sm rounded-lg transition-all duration-200 ${
                        isSelected
                          ? "bg-sky-500 text-white font-semibold shadow-md scale-105"
                          : isToday
                          ? "bg-sky-100 text-sky-700 font-semibold border-2 border-sky-300"
                          : isDisabled
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100 hover:scale-105 active:scale-95"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        </>
      )}
    </div>
  );
}
