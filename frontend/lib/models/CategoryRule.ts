import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";
import {
  ALL_TRANSACTION_CATEGORIES,
  TransactionCategory,
} from "./Transaction";

export type RuleLogic = "And" | "Or";
export type RuleField = "Description" | "Amount" | "Category" | "Pocket";
export type RuleOperator =
  | "Contains"
  | "Equals"
  | "Gt"
  | "Gte"
  | "Lt"
  | "Lte"
  | "Eq"
  | "NotEquals";

export interface CategoryRuleCondition {
  field: RuleField;
  operator: RuleOperator;
  value: string;
}

export interface CategoryRuleGroup {
  logic?: RuleLogic;
  conditions: CategoryRuleCondition[];
}

export interface CategoryRule {
  id: number;
  name: string;
  enabled: boolean;
  sortOrder: number;
  targetCategory: TransactionCategory;
  groupLogic: RuleLogic;
  groups: CategoryRuleGroup[];
}

export type CategoryRulePayload = Omit<CategoryRule, "id" | "sortOrder">;

export interface CategoryRuleApplyPreviewItem {
  transactionId: number;
  description?: string;
  amount: number;
  date: string;
  oldCategory: TransactionCategory;
  newCategory: TransactionCategory;
  matchedRuleId: number;
  matchedRuleName: string;
}

export const RULE_CATEGORIES = ALL_TRANSACTION_CATEGORIES;

export const OPERATORS_BY_FIELD: Record<RuleField, RuleOperator[]> = {
  Description: ["Contains", "Equals"],
  Amount: ["Gt", "Gte", "Lt", "Lte", "Eq"],
  Category: ["Equals", "NotEquals"],
  Pocket: ["Equals", "NotEquals"],
};

export function createEmptyCondition(
  field: RuleField = "Description",
): CategoryRuleCondition {
  return {
    field,
    operator: OPERATORS_BY_FIELD[field][0],
    value: "",
  };
}

export function createEmptyGroup(): CategoryRuleGroup {
  return { conditions: [createEmptyCondition()] };
}

export function createEmptyRule(): CategoryRulePayload {
  return {
    name: "",
    enabled: true,
    targetCategory: TransactionCategory.Other,
    groupLogic: "Or",
    groups: [createEmptyGroup()],
  };
}

export function cloneRulePayload(
  rule: CategoryRule | CategoryRulePayload,
  name = rule.name,
): CategoryRulePayload {
  return {
    name,
    enabled: rule.enabled,
    targetCategory: rule.targetCategory,
    groupLogic: rule.groupLogic,
    groups: rule.groups.map((group) => ({
      logic: group.logic,
      conditions: group.conditions.map((condition) => ({ ...condition })),
    })),
  };
}

export function duplicateRulePayload(rule: CategoryRule): CategoryRulePayload {
  return cloneRulePayload(rule, `${rule.name} (copy)`);
}

export function normalizeRuleGroups(
  groups: CategoryRuleGroup[],
): CategoryRuleGroup[] {
  return groups.map((group) => ({
    logic: group.conditions.length >= 2 ? (group.logic ?? "And") : undefined,
    conditions: group.conditions,
  }));
}

export async function getCategoryRules(): Promise<
  FetchWrapperResponse<CategoryRule[]>
> {
  return await get<CategoryRule[]>("/api/category-rules");
}

export async function createCategoryRule(
  rule: CategoryRulePayload,
): Promise<FetchWrapperResponse<CategoryRule>> {
  return await post<CategoryRule>("/api/category-rules", {
    ...rule,
    groups: normalizeRuleGroups(rule.groups),
  });
}

export async function updateCategoryRule(
  id: number,
  rule: CategoryRulePayload,
): Promise<FetchWrapperResponse<CategoryRule>> {
  return await put<CategoryRule>(`/api/category-rules/${id}`, {
    ...rule,
    groups: normalizeRuleGroups(rule.groups),
  });
}

export async function deleteCategoryRule(
  id: number,
): Promise<FetchWrapperResponse<void>> {
  return await del(`/api/category-rules/${id}`);
}

export async function reorderCategoryRules(
  ids: number[],
): Promise<FetchWrapperResponse<void>> {
  return await put("/api/category-rules/reorder", { ids });
}

export interface PreviewApplyFilters {
  pocketId?: number;
  from?: string;
  to?: string;
}

export async function previewApplyCategoryRules(
  filters: PreviewApplyFilters = {},
): Promise<FetchWrapperResponse<CategoryRuleApplyPreviewItem[]>> {
  return await post<CategoryRuleApplyPreviewItem[]>(
    "/api/category-rules/preview-apply",
    {
      pocketId: filters.pocketId ?? null,
      from: filters.from ?? null,
      to: filters.to ?? null,
    },
  );
}

export async function applyCategoryRules(
  transactionIds: number[],
): Promise<FetchWrapperResponse<{ updatedCount: number }>> {
  return await post("/api/category-rules/apply", { transactionIds });
}
