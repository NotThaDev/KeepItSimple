"use client";

import { DataTable } from "@/components/common/dataTable/DataTable";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import { Category } from "@/lib/models/Category";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryDrawerContent } from "./categoryDrawer/CategoryDrawerContent";
import { getCategoryColumns } from "./categoriesTable/CategoryColumns";

interface CategoriesPageContentProps {
  categoriesResponse: FetchWrapperResponse<Category[]>;
}

export function CategoriesPageContent({
  categoriesResponse,
}: Readonly<CategoriesPageContentProps>) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const loadFailed = "error" in categoriesResponse;

  useEffect(() => {
    if (loadFailed) {
      toast.error("Failed to load categories. Please try again later.");
    }
  }, [loadFailed]);

  // Custom categories first, then defaults, each by id.
  const categories = useMemo(
    () =>
      [...(categoriesResponse.data ?? [])].sort(
        (a, b) =>
          Number(a.key !== null) - Number(b.key !== null) || a.id - b.id,
      ),
    [categoriesResponse.data],
  );
  const hasCustom = categories.some((c) => c.key === null);

  const refresh = () => router.refresh();

  const columns = useMemo(
    () => getCategoryColumns({ onChanged: () => router.refresh() }),
    [router],
  );

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <Drawer open={createOpen} onOpenChange={setCreateOpen} direction="right">
        {createOpen ? (
          <CategoryDrawerContent
            onSave={() => {
              setCreateOpen(false);
              refresh();
            }}
          />
        ) : null}

        {hasCustom ? null : (
          <p className="text-sm text-muted-foreground">
            Create your own categories to track what the defaults don&apos;t
            cover.
          </p>
        )}

        <DataTable
          className="min-h-[580px]"
          columns={columns}
          data={categories}
          initialState={{ pagination: { pageSize: 10 } }}
          extraContent={
            <DrawerTrigger asChild>
              <Button size="lg" className="w-[fit-content]">
                <Plus />
                New category
              </Button>
            </DrawerTrigger>
          }
        />
      </Drawer>
    </div>
  );
}
