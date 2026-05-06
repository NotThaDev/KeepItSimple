import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { NewExpenseButton } from "@/app/tracker/NewExpenseButton";
import { getExpenses } from "@/lib/models/Expense";
import { expenseColumns } from "./expenseTable/ExpenseColumns";
import { DataTable } from "@/components/common/dataTable/DataTable";
import { toast } from "sonner";

export default async function TrackerPage() {
  const expenses = await getExpenses();

  if ("error" in expenses) {
    toast.error("Failed to load expenses. Please try again later.");
    return (
      <PageWrapper title="Tracker" extraContent={<NewExpenseButton />}>
        <div className="text-center text-muted-foreground">
          Failed to load expenses. Please try again later.
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Tracker">
      <div className="flex flex-col gap-4 items-end">
        <DataTable
          className="min-h-[580]"
          columns={expenseColumns}
          data={expenses.data ?? []}
          initialState={{ pagination: { pageSize: 10 } }}
          extraContent={<NewExpenseButton />}
        />
      </div>
    </PageWrapper>
  );
}
