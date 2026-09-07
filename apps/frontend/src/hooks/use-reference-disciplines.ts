"use client";

import { useEffect, useState } from "react";
import { getReferenceDisciplines } from "@/lib/api";
import { normalizeProfileOption, profileDisciplines } from "@/lib/profile-options";

export function useReferenceDisciplines() {
  const [disciplines, setDisciplines] = useState(profileDisciplines);

  useEffect(() => {
    let isMounted = true;

    getReferenceDisciplines()
      .then((items) => {
        if (!isMounted) {
          return;
        }

        setDisciplines(normalizeDisciplineOptions(items));
      })
      .catch(() => {
        if (isMounted) {
          setDisciplines(profileDisciplines);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return disciplines;
}

function normalizeDisciplineOptions(items: unknown) {
  if (!Array.isArray(items)) {
    return profileDisciplines;
  }

  const seen = new Set<string>();
  const nextDisciplines: string[] = [];

  for (const item of items) {
    if (typeof item !== "string" || !item.trim()) {
      continue;
    }

    const discipline = item.trim();
    const key = normalizeProfileOption(discipline);

    if (key === normalizeProfileOption("Autre")) {
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      nextDisciplines.push(discipline);
    }
  }

  if (nextDisciplines.length === 0) {
    return profileDisciplines;
  }

  return [...nextDisciplines, "Autre"];
}
