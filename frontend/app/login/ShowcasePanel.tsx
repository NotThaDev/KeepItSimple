export function ShowcasePanel() {
  return (
    <aside className="hidden flex-col justify-center gap-10 rounded-3xl bg-indigo-600 p-12 text-white lg:flex">
      <div className="max-w-lg space-y-4">
        <h2 className="text-4xl font-medium leading-tight">
          Keep your money simple.
        </h2>
        <p className="text-indigo-100">
          Import your transactions, sort them into categories and see where
          every euro goes.
        </p>
      </div>
      <div aria-hidden className="grid max-w-lg grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/15 p-5">
          <p className="text-sm text-indigo-100">Total balance</p>
          <p className="mt-2 text-3xl font-semibold">€12,480</p>
        </div>
        <div className="rounded-2xl bg-card p-5 text-card-foreground">
          <p className="text-sm text-muted-foreground">Saved this month</p>
          <p className="mt-2 text-3xl font-semibold">€640</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 8% from last month</p>
        </div>
        <div className="col-span-2 space-y-3 rounded-2xl bg-card p-5 text-sm text-card-foreground">
          {[
            ["Groceries", "-€84.20"],
            ["Salary", "+€2,350.00"],
            ["Rent", "-€750.00"],
          ].map(([label, amount]) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <span className="font-medium">{amount}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
