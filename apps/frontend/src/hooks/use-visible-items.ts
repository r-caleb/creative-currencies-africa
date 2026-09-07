"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function useVisibleItems<T>(items: T[], pageSize = 12) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const hasMore = visibleCount < items.length;
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(current + pageSize, items.length));
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, items.length, pageSize]);

  return {
    hasMore,
    loadMoreRef,
    totalCount: items.length,
    visibleCount: Math.min(visibleCount, items.length),
    visibleItems,
  };
}
