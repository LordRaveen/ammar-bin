export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
  const pageSize = Math.min(100, Math.max(10, Number.parseInt(searchParams.get("pageSize") || "25")))

  return { page, pageSize }
}

export function calculatePaginationRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { from, to }
}

export function createPaginationResult<T>(data: T[], count: number, params: PaginationParams): PaginationResult<T> {
  const totalPages = Math.ceil(count / params.pageSize)

  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total: count,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrevious: params.page > 1,
    },
  }
}
