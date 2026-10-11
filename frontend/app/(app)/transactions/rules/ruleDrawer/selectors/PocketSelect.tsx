import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Select } from "@/components/ui/select";
import { Pocket } from "@/lib/models/Pocket";

interface PocketValueSelectProps {
  value: string;
  pockets: Pocket[];
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function PocketSelect({
  value,
  pockets,
  onChange,
  invalid,
}: Readonly<PocketValueSelectProps>) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-invalid={invalid} className="min-w-0 flex-1">
        <SelectValue placeholder="Pocket" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {pockets.map((pocket) => (
            <SelectItem key={pocket.id} value={String(pocket.id)}>
              {pocket.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
