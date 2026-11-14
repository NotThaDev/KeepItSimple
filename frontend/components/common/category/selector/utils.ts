import type { CategoryGroup } from "@/stores/categories";

export function filterCategoryGroups(
  groups: CategoryGroup[],
  query: string,
): CategoryGroup[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return groups;
  }

  return groups
    .map((group) => {
      if (group.label.toLowerCase().includes(normalized)) {
        return group;
      }

      return {
        ...group,
        categories: group.categories.filter((category) =>
          category.name.toLowerCase().includes(normalized),
        ),
      };
    })
    .filter((group) => group.categories.length > 0);
}

export function selectItemValue(groupId: string, categoryId: number) {
  return `${groupId}::${categoryId}`;
}

export function categoryIdFromItemValue(value: string) {
  const id = Number(value.split("::").at(-1));
  return Number.isInteger(id) ? id : undefined;
}

export function groupIdForCategory(groups: CategoryGroup[], categoryId: number) {
  return (
    groups.find((group) => group.categories.some((c) => c.id === categoryId))
      ?.id ??
    groups[0]?.id ??
    "Other"
  );
}
