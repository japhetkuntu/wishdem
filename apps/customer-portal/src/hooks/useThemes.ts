import { useEffect, useState } from "react";
import { listThemes } from "@/lib/api";
import type { Theme } from "@/types";

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listThemes().then((data) => {
      setThemes(data);
      setLoading(false);
    });
  }, []);

  return { themes, loading };
}
