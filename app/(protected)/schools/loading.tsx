export default function SchoolsLoading() {
  return (
    <div className="space-y-3">
      <div className="h-7 w-24 animate-pulse rounded bg-slate-200" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ui-card ui-card-pad animate-pulse">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-100" />
              </div>
              <div className="h-9 w-20 rounded-xl bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
