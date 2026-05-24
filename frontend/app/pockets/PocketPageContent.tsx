"use client";

import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import { Pocket } from "@/lib/models/Pocket";
import { toast } from "sonner";
import { PocketCard } from "./PocketCard";
import { Plus, WalletCards } from "lucide-react";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { PocketDrawerContent } from "./PocketDrawerContent";
import { useState } from "react";
import { useRouter } from "next/navigation";

const OPEN_NEW_POCKET_DRAWER_KEY = "kis:open-new-pocket-drawer";

interface PocketPageContentProps {
  pocketDataResponse: FetchWrapperResponse<Pocket[]>;
}

export function PocketPageContent({
  pocketDataResponse,
}: Readonly<PocketPageContentProps>) {
  const router = useRouter();

  if ("error" in pocketDataResponse) {
    toast.error("Failed to load pockets. Please try again later.");
  }

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const shouldOpen =
      sessionStorage.getItem(OPEN_NEW_POCKET_DRAWER_KEY) === true.toString();

    if (shouldOpen) {
      sessionStorage.removeItem(OPEN_NEW_POCKET_DRAWER_KEY);
    }

    return shouldOpen;
  });

  const pockets = pocketDataResponse.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
          {isOpen && (
            <PocketDrawerContent
              onSave={() => {
                setIsOpen(false);
                router.refresh();
              }}
            />
          )}

          {pockets.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center">
              <EmptyStateCard
                title="No pockets yet"
                description="You need to create a pocket before adding transactions."
                actionText="Create Pocket"
                onAction={() => setIsOpen(true)}
                icon={WalletCards}
              />
            </div>
          ) : (
            pockets.map((pocket) => (
              <PocketCard key={pocket.id} pocket={pocket} />
            ))
          )}

          {pockets.length > 0 && (
            <DrawerTrigger asChild>
              <Card className="cursor-pointer border-dashed border-2 hover:bg-muted/50 h-[250px] transition-colors hover:shadow-lg hover:border-primary/50 flex flex-col items-center justify-center gap-2">
                <div className="flex flex-col items-center justify-center gap-2 p-6">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <p className="text-base font-medium">Create New Pocket</p>
                </div>
              </Card>
            </DrawerTrigger>
          )}
        </Drawer>
      </div>
    </div>
  );
}
