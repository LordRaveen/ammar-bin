import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ClassDetailsLoading() {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Class switcher placeholder */}
          <Skeleton className="h-8 w-44 rounded-lg" />
          {/* View switcher buttons group placeholder */}
          <div className="flex h-7 items-center rounded-lg border bg-muted/40 p-0.5 gap-0.5">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </div>
        {/* Session / Term selectors */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Dynamic Tabs / View Content Area - mimicking Default Student View */}
      <div className="flex flex-col gap-4 flex-1">
        {/* 4 Completion Stats KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="py-0 shadow-none border bg-muted/10">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two-Column Student View Layout */}
        <div className="flex flex-1 gap-4 overflow-hidden min-h-[500px]">
          {/* Left Panel: Student list */}
          <Card className="w-[280px] sm:w-[320px] py-0 shadow-none border">
            <CardContent className="flex h-full flex-col gap-2.5 p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
              <div className="flex-1 space-y-2 border rounded-xl p-2 bg-background/50">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b last:border-0 border-border/20">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel: Student evaluation form details */}
          <Card className="flex-1 py-0 shadow-none border">
            <CardContent className="flex h-full flex-col gap-4 p-4 overflow-y-auto">
              {/* Mini details summary card row */}
              <div className="flex flex-wrap gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="min-w-[100px] flex-1 py-0 shadow-none bg-muted/10">
                    <CardContent className="p-3 space-y-1">
                      <Skeleton className="h-2.5 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Table skeleton */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2.5 w-40" />
                </div>
                <div className="border rounded-lg p-2 space-y-3">
                  <div className="grid grid-cols-7 gap-2 pb-2 border-b border-border/20">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <Skeleton key={i} className="h-3 w-full" />
                    ))}
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-7 gap-2 py-1 border-b last:border-0 border-border/10">
                      <Skeleton className="h-3 w-full col-span-2" />
                      <Skeleton className="h-3 w-8 mx-auto" />
                      <Skeleton className="h-3 w-8 mx-auto" />
                      <Skeleton className="h-3 w-8 mx-auto" />
                      <Skeleton className="h-3 w-8 mx-auto" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills & Remarks Skeletons */}
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="p-3 shadow-none bg-muted/5">
                  <Skeleton className="h-4 w-28 mb-3" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <Skeleton className="h-3.5 w-24" />
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((r) => (
                            <Skeleton key={r} className="h-4 w-4 rounded-sm" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <div className="space-y-3">
                  <Card className="p-3 shadow-none bg-muted/5">
                    <Skeleton className="h-4 w-28 mb-3" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center py-1">
                          <Skeleton className="h-3.5 w-24" />
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((r) => (
                              <Skeleton key={r} className="h-4 w-4 rounded-sm" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
