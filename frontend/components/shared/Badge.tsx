"use client";

interface BadgeProps {
  variant?: "default" | "success" | "error" | "warning" | "info";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  children,
  icon,
}) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold";

  const variants = {
    default:
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
    success:
      "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300",
    error: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300",
    warning:
      "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300",
    info: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  };

  return (
    <span className={`${baseClasses} ${variants[variant]}`}>
      {icon}
      {children}
    </span>
  );
};
