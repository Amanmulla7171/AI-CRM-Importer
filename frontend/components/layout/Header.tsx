"use client";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          AI CRM Importer
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Import and manage CRM data with AI-powered validation
        </p>
      </div>
    </header>
  );
};
