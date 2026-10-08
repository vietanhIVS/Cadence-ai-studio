"use client";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  ariaLabel?: string;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`segmented-pill-group inline-flex items-center p-1 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-inner backdrop-blur-md ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              if (!isSelected) onChange(opt.value);
            }}
            className={`flex-1 min-w-[54px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 text-center select-none cursor-pointer ${
              isSelected
                ? "bg-white text-blue-700 shadow-sm border border-blue-100 dark:bg-slate-700 dark:text-blue-300 dark:border-slate-600 font-bold scale-[1.02]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
