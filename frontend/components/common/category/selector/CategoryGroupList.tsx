import {
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Fragment } from "react";
import { selectItemValue, type CategoryGroup } from "./utils";
import { CategorySelectItem } from "./CategorySelectItem";

export function CategoryGroupList({ groups }: { groups: CategoryGroup[] }) {
  return groups.map((group, index) => (
    <Fragment key={group.id}>
      {index > 0 ? <SelectSeparator /> : null}
      <SelectGroup>
        <SelectLabel>{group.label}</SelectLabel>
        {group.categories.map((category) => (
          <CategorySelectItem
            key={`${group.id}-${category}`}
            category={category}
            itemValue={selectItemValue(group.id, category)}
          />
        ))}
      </SelectGroup>
    </Fragment>
  ));
}
