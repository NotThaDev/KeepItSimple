import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "./utils";

interface PasswordRequirementsProps {
  id: string;
  password: string;
}

export function PasswordRequirements({
  id,
  password,
}: Readonly<PasswordRequirementsProps>) {
  return (
    <ul id={id} className="grid gap-1 text-sm sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2 transition-colors",
              met ? "text-emerald-600" : "text-muted-foreground",
            )}
          >
            {met ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Circle className="size-4" aria-hidden />
            )}
            {rule.label}
            <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
