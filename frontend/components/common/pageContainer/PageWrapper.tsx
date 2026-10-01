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
      className={`flex h-screen w-full flex-col ${
        maximizeContent ? "gap-0 px-[16px] py-[16px]" : "gap-4 px-6 py-2"
      }`}
    >
      <div
        className={`flex w-full items-center justify-between ${
          maximizeContent ? "mb-0" : "mb-8 gap-4"
        }`}
      >
        {!maximizeContent && (
          <h1 className="mt-2 scroll-m-20 text-center text-3xl font-bold tracking-tight text-balance">
            {title}
          </h1>
        )}
        {extraContent}
      </div>
      <div
        className={
          maximizeContent ? "flex min-h-0 flex-1 flex-col" : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
