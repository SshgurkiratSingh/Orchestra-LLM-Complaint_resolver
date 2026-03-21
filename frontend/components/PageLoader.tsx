"use client";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
      {/* Animated logo mark */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 rounded-full bg-indigo-500/20 animate-ping" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
          LS
        </div>
      </div>

      {/* Shimmer bar */}
      <div className="w-48 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-indigo-500 animate-[shimmer_1.2s_ease-in-out_infinite]" />
      </div>

      <p className="text-sm font-medium text-slate-500 tracking-wide animate-pulse">
        {message}
      </p>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
