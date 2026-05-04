import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { NewExpenseButton } from "@/app/tracker/NewExpenseButton";
import { getExpenses } from "@/lib/models/Expense";
import { expenseColumns } from "./expenseTable/ExpenseColumns";
import { DataTable } from "@/components/common/DataTable/DataTable";

export default async function TrackerPage() {
  const expenses = await getExpenses();

  if ("error" in expenses) {
    // #TODO: handle error with a tooltip
    console.error("Error fetching expenses:", expenses.error);
  }

  return (
    <PageWrapper title="Tracker" extraContent={<NewExpenseButton />}>
      {/* #TODO we need to add the pagination */}
      {/* #TODO we need to add actions on the table rows EDIT and DELETE (next PR)*/}
      <DataTable columns={expenseColumns} data={expenses.data ?? []} />
    </PageWrapper>
  );
}
