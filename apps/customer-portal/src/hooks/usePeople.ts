import { useEffect, useState } from "react";
import { listPeople } from "@/lib/api";
import type { Person } from "@/types";

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPeople().then((data) => {
      setPeople(data);
      setLoading(false);
    });
  }, []);

  return { people, loading };
}
