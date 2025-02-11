import { Suspense } from "react";

interface SuspenseWrapperProps {
  children: React.ReactNode;
}

const LoadingSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="w-full max-w-3xl space-y-6 px-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg  bg-card p-4">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted"></div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SuspenseWrapper = ({ children }: SuspenseWrapperProps) => {
  return <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>;
};
