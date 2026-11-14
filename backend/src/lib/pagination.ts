export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePagination(input: {
  page?: unknown;
  pageSize?: unknown;
}): PaginationParams {
  const rawPage = Number(input.page ?? DEFAULT_PAGE);
  const rawSize = Number(input.pageSize ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const pageSize =
    Number.isFinite(rawSize) && rawSize > 0
      ? Math.min(Math.floor(rawSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginated<T>(
  data: T[],
  total: number,
  p: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page: p.page,
      pageSize: p.pageSize,
      total,
      totalPages: Math.ceil(total / p.pageSize),
    },
  };
}
