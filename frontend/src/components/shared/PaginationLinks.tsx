import Link from "next/link";

interface PaginationLinksProps {
  basePath: string;
  currentPage: number;
  lastPage: number;
  searchParams?: Record<string, string | string[] | undefined>;
  pageParam?: string;
}

export default function PaginationLinks({
  basePath,
  currentPage,
  lastPage,
  searchParams = {},
  pageParam = "page",
}: PaginationLinksProps) {
  if (lastPage <= 1) {
    return null;
  }

  const pages: (number | string)[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(lastPage, currentPage + 2);

  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push("ellipsis-start");
    }
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < lastPage) {
    if (end < lastPage - 1) {
      pages.push("ellipsis-end");
    }
    pages.push(lastPage);
  }

  const buildHref = (page: number) => {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === pageParam || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => params.append(key, entry));
        return;
      }

      if (value !== "") {
        params.set(key, value);
      }
    });

    if (page > 1) {
      params.set(pageParam, String(page));
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-10">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
          currentPage === 1
            ? "pointer-events-none opacity-50 border-[var(--border)] text-[var(--text-muted)]"
            : "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        }`}
      >
        Prev
      </Link>

      {pages.map((page) => typeof page === "string" ? (
        <span key={page} className="px-2 text-sm font-bold text-[var(--text-muted)]">...</span>
      ) : (
        <Link
          key={page}
          href={buildHref(page)}
          className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
            currentPage === page
              ? "bg-brand-500 text-white"
              : "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          }`}
        >
          {page}
        </Link>
      ))}

      <Link
        href={buildHref(Math.min(lastPage, currentPage + 1))}
        aria-disabled={currentPage === lastPage}
        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
          currentPage === lastPage
            ? "pointer-events-none opacity-50 border-[var(--border)] text-[var(--text-muted)]"
            : "border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        }`}
      >
        Next
      </Link>
    </div>
  );
}
