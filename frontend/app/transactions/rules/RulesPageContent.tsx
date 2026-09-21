"use client";

import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import {
  CategoryRule,
  reorderCategoryRules,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { ListFilter, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApplyRulesDialog } from "./ApplyRulesDialog";
import { RuleCard } from "./RuleCard";
import { RuleDrawerContent } from "./RuleDrawerContent";

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
  const pockets = pocketsResponse.data ?? [];

  const refresh = () => router.refresh();

  const handleMove = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= rules.length) {
      return;
    }

    const reordered = [...rules];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    const response = await reorderCategoryRules(reordered.map((rule) => rule.id));
    if (response.error) {
      toast.error(`Failed to reorder rules: ${response.error}`);
      return;
    }

    refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {rules.length > 0 ? <ApplyRulesDialog pockets={pockets} /> : null}
      </div>

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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {rules.map((rule, index) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                pockets={pockets}
                isFirst={index === 0}
                isLast={index === rules.length - 1}
                onMove={(direction) => handleMove(index, direction)}
                onChanged={refresh}
                onDuplicate={(source) => {
                  setCopyFrom(source);
                  setCreateOpen(true);
                }}
              />
            ))}
            <DrawerTrigger asChild>
              <Card className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg">
                <div className="flex flex-col items-center justify-center gap-2 p-6">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <p className="text-base font-medium">Create new rule</p>
                </div>
              </Card>
            </DrawerTrigger>
          </div>
        )}
      </Drawer>
    </div>
  );
}
