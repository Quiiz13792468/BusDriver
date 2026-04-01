export default function PickupLoading() {
  return (
    <div className="space-y-3">
      <div className="animate-pulse space-y-1">
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-100" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="ui-card ui-card-compact animate-pulse">
            <div className="mb-3 space-y-1">
              <div className="h-5 w-24 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-100" />
            </div>
            <div className="h-10 w-32 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
