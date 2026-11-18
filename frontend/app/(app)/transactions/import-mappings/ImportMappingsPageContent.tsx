"use client";

import { DataTable } from "@/components/common/dataTable/DataTable";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import { ImportMapping } from "@/lib/models/ImportMapping";
import { Columns3, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { MappingDrawerContent } from "./mappingDrawer/MappingDrawerContent";
import { getMappingColumns } from "./mappingsTable/MappingColumns";

interface ImportMappingsPageContentProps {
  mappingsResponse: FetchWrapperResponse<ImportMapping[]>;
}

export function ImportMappingsPageContent({
  mappingsResponse,
}: Readonly<ImportMappingsPageContentProps>) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  if ("error" in mappingsResponse) {
    toast.error("Failed to load import mappings. Please try again later.");
  }

  const mappings = useMemo(
    () => mappingsResponse.data ?? [],
    [mappingsResponse.data],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  const columns = useMemo(
    () => getMappingColumns({ onChanged: refresh }),
    [refresh],
  );

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <Drawer open={createOpen} onOpenChange={setCreateOpen} direction="right">
        {createOpen ? (
          <MappingDrawerContent
            onSave={() => {
              setCreateOpen(false);
              refresh();
            }}
          />
        ) : null}

        {mappings.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyStateCard
              title="No import mappings yet"
              description="Save a mapping from the import dialog, or create one here. When a file's headers match a saved mapping, it is applied automatically."
              actionText="Create mapping"
              onAction={() => setCreateOpen(true)}
              icon={Columns3}
            />
          </div>
        ) : (
          <DataTable
            className="min-h-[580px]"
            columns={columns}
            data={mappings}
            initialState={{ pagination: { pageSize: 10 } }}
            extraContent={
              <DrawerTrigger asChild>
                <Button size="lg" className="w-[fit-content]">
                  <Plus />
                  Create mapping
                </Button>
              </DrawerTrigger>
            }
          />
        )}
      </Drawer>
    </div>
  );
}
