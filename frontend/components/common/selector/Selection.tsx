import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectionProps {
  items: { value: string; label: string }[];
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  isInvalid?: boolean;
}

export function Selection({
  items,
  defaultValue,
  placeholder,
  onChange,
  isInvalid,
}: Readonly<SelectionProps>) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-invalid={isInvalid}>
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
