import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ClassesLoading() {
  return (
    <div className="space-y-6 pt-2">
      {/* Page Title skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      {/* 4 KPI Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border shadow-none bg-white dark:bg-zinc-950 overflow-hidden">
            <CardContent className="py-3 px-3 space-y-2">
              <Skeleton className="h-3 w-16 uppercase tracking-wider" />
              <div className="flex items-end gap-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3.5 w-24 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs and Actions row placeholder */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        {/* Tabs skeleton */}
        <div className="flex bg-zinc-100/60 dark:bg-zinc-900/60 p-0.5 h-9 gap-1 items-center rounded-lg w-fit border border-zinc-200/50 dark:border-zinc-800/80">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        {/* Actions skeleton */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Skeleton className="h-9 w-60 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Classes cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((card) => (
          <Card key={card} className="relative overflow-hidden border shadow-none bg-zinc-50 dark:bg-zinc-950 flex flex-col pt-0">
            <CardContent className="p-3 flex flex-col flex-1 gap-4">
              {/* Top part */}
              <div className="flex justify-between items-start">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-5 w-28 uppercase" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-4.5 w-16 rounded-md" />
                </div>
              </div>

              {/* Bottom part grid */}
              <div className="grid grid-cols-2 gap-2 mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-2">
                <div className="space-y-1">
                  <Skeleton className="h-2 w-10 uppercase" />
                  <Skeleton className="h-4.5 w-16" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2 w-12 uppercase" />
                  <Skeleton className="h-4.5 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
