import { PropsWithChildren, ReactNode } from "react";

interface PageWrapperProps extends PropsWithChildren {
  title: string;
  extraContent?: ReactNode;
}

export function PageWrapper({
  children,
  title,
  extraContent,
}: PageWrapperProps) {
  return (
    <div className="h-screen px-6 py-2 flex flex-col gap-4 full-width">
      <div className="flex gap-4 full-width justify-between items-center mb-8">
        <h1 className="scroll-m-20 text-center text-3xl font-bold tracking-tight text-balance mt-2">
          {title}
        </h1>
        {extraContent}
      </div>
      {children}
    </div>
  );
}
