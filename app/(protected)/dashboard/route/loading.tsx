export default function RouteLoading() {
  return (
    <div className="space-y-3">
      <div className="animate-pulse space-y-1">
        <div className="h-6 w-28 rounded bg-slate-200" />
        <div className="h-4 w-48 rounded bg-slate-100" />
      </div>
      <div className="ui-card animate-pulse">
        <div className="h-64 rounded-xl bg-slate-100" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="ui-card ui-card-compact animate-pulse">
            <div className="h-5 w-32 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
