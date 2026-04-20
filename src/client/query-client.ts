import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus in development — reduces noise.
      refetchOnWindowFocus: import.meta.env.PROD,
      // Keep data fresh for 1 minute by default.
      staleTime: 60_000,
      // Retry once on failure (default 3 is too aggressive for 401s).
      retry: 1,
    },
  },
})
