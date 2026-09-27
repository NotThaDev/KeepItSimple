"use client";

import { DataTable } from "@/components/common/dataTable/DataTable";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import { CategoryRule, reorderCategoryRules } from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { ListFilter, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApplyRulesDialog } from "./ApplyRulesDialog";
import { RuleDrawerContent } from "./ruleDrawer/RuleDrawerContent";
import { getRuleColumns } from "./rulesTable/RuleColumns";

interface RulesPageContentProps {
  rulesResponse: FetchWrapperResponse<CategoryRule[]>;
  pocketsResponse: FetchWrapperResponse<Pocket[]>;
}

export function RulesPageContent({
  rulesResponse,
  pocketsResponse,
}: Readonly<RulesPageContentProps>) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState<CategoryRule | undefined>();

  if ("error" in rulesResponse) {
    toast.error("Failed to load rules. Please try again later.");
  }

  const rules = useMemo(
    () =>
      [...(rulesResponse.data ?? [])].sort(
        (left, right) => left.sortOrder - right.sortOrder,
      ),
    [rulesResponse.data],
  );
  const pockets = useMemo(
    () => pocketsResponse.data ?? [],
    [pocketsResponse.data],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  const handleMove = useCallback(
    async (index: number, direction: -1 | 1) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= rules.length) {
        return;
      }

      const reordered = [...rules];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(nextIndex, 0, moved);
      const response = await reorderCategoryRules(
        reordered.map((rule) => rule.id),
      );
      if (response.error) {
        toast.error(`Failed to reorder rules: ${response.error}`);
        return;
      }

      refresh();
    },
    [refresh, rules],
  );

  const handleDuplicate = useCallback((source: CategoryRule) => {
    setCopyFrom(source);
    setCreateOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getRuleColumns({
        rules,
        pockets,
        onMove: handleMove,
        onChanged: refresh,
        onDuplicate: handleDuplicate,
      }),
    [handleDuplicate, handleMove, pockets, refresh, rules],
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <Drawer
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCopyFrom(undefined);
          }
        }}
        direction="right"
      >
        {createOpen ? (
          <RuleDrawerContent
            copyFrom={copyFrom}
            pockets={pockets}
            onSave={() => {
              setCreateOpen(false);
              setCopyFrom(undefined);
              refresh();
            }}
          />
        ) : null}

        {rules.length === 0 ? (
          <div className="flex justify-center">
            <EmptyStateCard
              title="No category rules yet"
              description="Create a rule to set a category from description, amount, pocket, or the current category. Groups act as parentheses."
              actionText="Create rule"
              onAction={() => setCreateOpen(true)}
              icon={ListFilter}
            />
          </div>
        ) : (
          <DataTable
            className="min-h-[580px]"
            columns={columns}
            data={rules}
            initialState={{ pagination: { pageSize: 10 } }}
            extraContent={
              <div className="flex items-center gap-2">
                <ApplyRulesDialog pockets={pockets} />
                <DrawerTrigger asChild>
                  <Button size="lg" className="w-[fit-content]">
                    <Plus />
                    Create rule
                  </Button>
                </DrawerTrigger>
              </div>
            }
          />
        )}
      </Drawer>
    </div>
  );
}
