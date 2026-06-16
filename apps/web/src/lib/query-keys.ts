export const QUERY_KEYS = {
  user: {
    me: () => ['user', 'me'] as const,
  },
  workouts: {
    today: (dayNumber: number) => ['workouts', 'today', dayNumber] as const,
    week: () => ['workouts', 'week'] as const,
    day: (dayNumber: number) => ['workouts', 'day', dayNumber] as const,
    sessions: {
      active: () => ['workouts', 'sessions', 'active'] as const,
      detail: (sessionId: string) => ['workouts', 'sessions', sessionId] as const,
    },
    exerciseStats: (exerciseId: string) => ['workouts', 'exercise', exerciseId, 'stats'] as const,
  },
  nutrition: {
    today: () => ['nutrition', 'today'] as const,
  },
} as const;
