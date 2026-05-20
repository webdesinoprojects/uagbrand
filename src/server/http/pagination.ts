import "server-only";

export type PaginationInput = {
  page?: string | number | null;
  pageSize?: string | number | null;
};

export type Pagination = {
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

export function getPagination(input: PaginationInput = {}): Pagination {
  const page = clampPositiveInteger(input.page, DEFAULT_PAGE);
  const pageSize = Math.min(
    clampPositiveInteger(input.pageSize, DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return {
    page,
    pageSize,
    from,
    to,
  };
}

export function getPageCount(total: number, pageSize: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.ceil(total / pageSize);
}

export function buildPaginationMeta({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  return {
    page,
    pageSize,
    total,
    pageCount: getPageCount(total, pageSize),
  };
}

function clampPositiveInteger(
  value: string | number | null | undefined,
  fallback: number,
) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}
