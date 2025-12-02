export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="h-8 w-32 bg-muted animate-pulse rounded" />

      {/* Settings Form */}
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
