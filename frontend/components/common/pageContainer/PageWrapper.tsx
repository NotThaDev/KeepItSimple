import { cn } from "@/lib/utils";
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
}: Readonly<PageWrapperProps>) {
  const showDesktopTitle = !maximizeContent;
  const showToolbar = showDesktopTitle || Boolean(extraContent);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        maximizeContent
          ? "h-full min-h-0 gap-0 px-4 py-4 md:px-[16px] md:py-[16px]"
          : "min-h-full gap-4 px-4 py-3 md:px-6 md:py-2",
      )}
    >
      {showToolbar && (
        <div
          className={cn(
            "flex w-full items-center justify-between",
            maximizeContent ? "mb-0" : "mb-4 gap-4 md:mb-8",
          )}
        >
          {showDesktopTitle && (
            <h1 className="mt-2 hidden scroll-m-20 text-center text-3xl font-bold tracking-tight text-balance md:block">
              {title}
            </h1>
          )}
          {extraContent}
        </div>
      )}
      <div
        className={maximizeContent ? "flex min-h-0 flex-1 flex-col" : undefined}
      >
        {children}
      </div>
    </div>
  );
}
