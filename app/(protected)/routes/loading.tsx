export default function RoutesLoading() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-7 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ui-card ui-card-pad animate-pulse">
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
