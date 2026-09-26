/**
 * Progress bar component for visualizing completion percentage.
 * Used primarily on project cards and detail pages.
 */

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3",
};

const variantClasses = {
  default: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Auto-select variant based on completion percentage
  const autoVariant =
    variant === "default"
      ? percentage >= 90
        ? "success"
        : percentage >= 50
        ? "default"
        : percentage >= 25
        ? "warning"
        : "danger"
      : variant;

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${Math.round(percentage)}% complete`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variantClasses[autoVariant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
