export default function BoardLoading() {
  return (
    <div className="space-y-3">
      <div className="h-7 w-36 animate-pulse rounded bg-slate-200" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ui-card ui-card-pad animate-pulse">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-5 w-48 rounded bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
