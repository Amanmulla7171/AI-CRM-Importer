"use client";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning";
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  variant = "default",
}) => {
  const variants = {
    default:
      "from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 border-zinc-200 dark:border-zinc-800",
    success:
      "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800",
    error:
      "from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-200 dark:border-red-800",
    warning:
      "from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800",
  };

  const labelColors = {
    default: "text-zinc-600 dark:text-zinc-400",
    success: "text-green-700 dark:text-green-300",
    error: "text-red-700 dark:text-red-300",
    warning: "text-yellow-700 dark:text-yellow-300",
  };

  const valueColors = {
    default: "text-zinc-900 dark:text-zinc-50",
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${variants[variant]} rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${labelColors[variant]} mb-2`}>
            {label}
          </p>
          <p className={`text-3xl font-bold ${valueColors[variant]}`}>
            {value}
          </p>
        </div>
        {icon && <div className="text-2xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
};
