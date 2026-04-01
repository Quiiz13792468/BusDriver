export default function DashboardLoading() {
  return (
    <div className="space-y-3">
      <div className="ui-card ui-card-pad animate-pulse">
        <div className="h-6 w-32 rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          <div className="h-12 rounded-xl bg-slate-100" />
          <div className="h-12 rounded-xl bg-slate-100" />
          <div className="h-12 rounded-xl bg-slate-100" />
        </div>
      </div>
      <div className="ui-card ui-card-pad animate-pulse">
        <div className="h-5 w-24 rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          <div className="h-16 rounded-xl bg-slate-100" />
          <div className="h-16 rounded-xl bg-slate-100" />
        </div>
      </div>
      <div className="ui-card ui-card-pad animate-pulse">
        <div className="h-5 w-28 rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
