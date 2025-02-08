import { Suspense } from "react";

interface SuspenseWrapperProps {
  children: React.ReactNode;
}

const LoadingSpinner = () => (
  <div className="h-screen w-full flex items-center justify-center bg-base-100">
    <div className="flex flex-col items-center gap-4">
      <div className="loading loading-spinner loading-lg text-primary"></div>
      <div className="text-base-content/60 text-sm font-medium">
        加载中，请稍候...
      </div>
    </div>
  </div>
);

export const SuspenseWrapper = ({ children }: SuspenseWrapperProps) => {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
};
