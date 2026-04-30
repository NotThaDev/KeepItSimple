import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewExpenseButton() {
  return (
    <Button variant="outline" size="lg">
      <Plus />
      New Expense
    </Button>
  );
}
