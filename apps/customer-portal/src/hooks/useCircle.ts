import { useCallback, useEffect, useState } from "react";
import {
  addCirclePerson,
  getCircleStats,
  listCirclePeople,
  listSharedInvitations,
  type AddCirclePersonInput,
} from "@/lib/api";
import type { CirclePerson, CircleStats, GroupInvitation } from "@/types";

export function useCircle() {
  const [people, setPeople] = useState<CirclePerson[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [stats, setStats] = useState<CircleStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([listCirclePeople(), listSharedInvitations(), getCircleStats()]).then(
      ([peopleData, invitationsData, statsData]) => {
        setPeople(peopleData);
        setInvitations(invitationsData);
        setStats(statsData);
        setLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPerson = useCallback(async (input: AddCirclePersonInput) => {
    const person = await addCirclePerson(input);
    setPeople((prev) => [person, ...prev]);
    return person;
  }, []);

  return { people, invitations, stats, loading, addPerson };
}
