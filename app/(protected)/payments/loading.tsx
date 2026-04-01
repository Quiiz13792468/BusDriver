export default function PaymentsLoading() {
  return (
    <div className="space-y-3">
      <div className="ui-card ui-card-pad animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 rounded-lg bg-slate-200" />
          <div className="h-9 w-16 rounded-lg bg-slate-200" />
          <div className="h-9 w-16 rounded-lg bg-slate-200" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="ui-card ui-card-compact animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-5 w-20 rounded bg-slate-200" />
                <div className="h-4 w-16 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
