export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
