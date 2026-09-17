import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectionProps {
  items: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  isInvalid?: boolean;
  className?: string;
}

export function Selection({
  items,
  value,
  defaultValue,
  placeholder,
  onChange,
  isInvalid,
  className,
}: Readonly<SelectionProps>) {
  return (
    <Select
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onValueChange={onChange}
    >
      <SelectTrigger
        className={cn("w-full", className)}
        aria-invalid={isInvalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
