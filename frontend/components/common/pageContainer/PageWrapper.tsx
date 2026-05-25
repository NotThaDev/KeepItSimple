import { PropsWithChildren, ReactNode } from "react";

interface PageWrapperProps extends PropsWithChildren {
  title: string;
  extraContent?: ReactNode;
  maximizeContent?: boolean;
}

export function PageWrapper({
  children,
  title,
  extraContent,
  maximizeContent = false,
}: PageWrapperProps) {
  return (
    <div
      className={`h-screen flex flex-col w-full ${
        maximizeContent ? "px-[16px] py-[16px] gap-0" : "px-6 py-2 gap-4"
      }`}
    >
      <div
        className={`flex w-full justify-between items-center ${
          maximizeContent ? "mb-0" : "gap-4 mb-8"
        }`}
      >
        {!maximizeContent && (
          <h1 className="scroll-m-20 text-center text-3xl font-bold tracking-tight text-balance mt-2">
            {title}
          </h1>
        )}
        {extraContent}
      </div>
      {children}
    </div>
  );
}
