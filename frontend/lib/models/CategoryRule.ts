import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";
import type { Category } from "./Category";

export enum RuleLogic {
  And = "And",
  Or = "Or",
}

export enum RuleField {
  Description = "Description",
  Amount = "Amount",
  Category = "Category",
  Pocket = "Pocket",
}

export enum RuleOperator {
  Contains = "Contains",
  Equals = "Equals",
  Gt = "Gt",
  Gte = "Gte",
  Lt = "Lt",
  Lte = "Lte",
  Eq = "Eq",
  NotEquals = "NotEquals",
}

export interface CategoryRuleCondition {
  logic?: RuleLogic;
  field: RuleField;
  operator: RuleOperator;
  value: string;
}

export interface CategoryRuleGroup {
  conditions: CategoryRuleCondition[];
}

export interface CategoryRule {
  id?: number;
  name: string;
  enabled: boolean;
  sortOrder?: number;
  targetCategoryId: number;
  groupLogic: RuleLogic;
  groups: CategoryRuleGroup[];
}

export interface CategoryRulePreviewItem {
  transactionId: number;
  description?: string;
  amount: number;
  date: string;
  oldCategoryId: number;
  newCategoryId: number;
  matchedRuleId: number;
  matchedRuleName: string;
}

export const OPERATORS_BY_FIELD: Record<RuleField, RuleOperator[]> = {
  [RuleField.Description]: [RuleOperator.Contains, RuleOperator.Equals],
  [RuleField.Amount]: [
    RuleOperator.Gt,
    RuleOperator.Gte,
    RuleOperator.Lt,
    RuleOperator.Lte,
    RuleOperator.Eq,
  ],
  [RuleField.Category]: [RuleOperator.Equals, RuleOperator.NotEquals],
  [RuleField.Pocket]: [RuleOperator.Equals, RuleOperator.NotEquals],
};

// A Category condition value is a category id.
export function resolveConditionCategory(
  value: string,
  categories: Category[],
): Category | undefined {
  const id = Number(value);
  return value.trim() !== "" && Number.isInteger(id)
    ? categories.find((category) => category.id === id)
    : undefined;
}

export function normalizeRuleGroups(
  groups: CategoryRuleGroup[],
): CategoryRuleGroup[] {
  return groups.map((group) => ({
    conditions: group.conditions.map((condition, index) => {
      const next: CategoryRuleCondition = {
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
      };
      if (index > 0) {
        next.logic = condition.logic ?? RuleLogic.And;
      }
      return next;
    }),
  }));
}

export async function getCategoryRules(): Promise<
  FetchWrapperResponse<CategoryRule[]>
> {
  return await get<CategoryRule[]>("/api/category-rules");
}

function ruleRequestBody(rule: CategoryRule) {
  return {
    name: rule.name,
    enabled: rule.enabled,
    targetCategoryId: rule.targetCategoryId,
    groupLogic: rule.groupLogic,
    groups: normalizeRuleGroups(rule.groups),
    ...(rule.id != null ? { id: rule.id } : {}),
    ...(rule.sortOrder != null ? { sortOrder: rule.sortOrder } : {}),
  };
}

export async function createCategoryRule(
  rule: CategoryRule,
): Promise<FetchWrapperResponse<CategoryRule>> {
  return await post<CategoryRule>("/api/category-rules", ruleRequestBody(rule));
}

export async function updateCategoryRule(
  id: number,
  rule: CategoryRule,
): Promise<FetchWrapperResponse<CategoryRule>> {
  return await put<CategoryRule>(
    `/api/category-rules/${id}`,
    ruleRequestBody(rule),
  );
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

export interface PreviewFilters {
  pocketId?: number;
  from?: string;
  to?: string;
}

export async function previewCategoryRules(
  filters: PreviewFilters = {},
): Promise<FetchWrapperResponse<CategoryRulePreviewItem[]>> {
  return await post<CategoryRulePreviewItem[]>("/api/category-rules/preview", {
    pocketId: filters.pocketId ?? null,
    from: filters.from ?? null,
    to: filters.to ?? null,
  });
}

export async function applyCategoryRules(
  transactionIds: number[],
): Promise<FetchWrapperResponse<{ updatedCount: number }>> {
  return await post("/api/category-rules/apply", { transactionIds });
}
