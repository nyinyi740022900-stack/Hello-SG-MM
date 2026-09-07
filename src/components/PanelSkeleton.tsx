/**
 * Placeholders held in the layout while a slow panel streams in.
 *
 * Each one reserves close to the height its real panel will occupy. That is
 * the whole point: if the placeholder is shorter than the content, the feed
 * jumps down the moment the data lands, and on a phone that means someone's
 * thumb lands on the wrong row. Reserving the space costs nothing and keeps
 * the page still.
 *
 * `animate-pulse` is dropped under prefers-reduced-motion — a full-width
 * pulsing block is exactly the kind of motion that setting exists for.
 */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-surface-muted ${className}`} />;
}

export function ConditionsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-border bg-surface p-4 motion-reduce:animate-none"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Bar className="h-5 w-40" />
        <Bar className="h-5 w-20" />
        <Bar className="h-5 w-16" />
      </div>
      <Bar className="mt-3 h-3 w-3/4" />
    </div>
  );
}

export function RatePanelSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-border bg-surface p-4 motion-reduce:animate-none"
    >
      <div className="flex items-center justify-between gap-3">
        <Bar className="h-5 w-32" />
        <Bar className="h-5 w-24 rounded-full" />
      </div>
      <div className="mt-3 divide-y divide-border">
        {/* Five rows, one per country, so the height matches the real panel. */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <Bar className="h-5 w-5 rounded-full" />
              <div className="space-y-1.5">
                <Bar className="h-3.5 w-24" />
                <Bar className="h-2.5 w-20" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <Bar className="ml-auto h-4 w-16" />
              <Bar className="ml-auto h-2.5 w-12" />
            </div>
          </div>
        ))}
      </div>
      <Bar className="mt-3 h-3 w-full" />
    </div>
  );
}
