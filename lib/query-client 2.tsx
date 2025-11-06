'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimized for fast loading with cache
            staleTime: 60 * 1000, // 1 minute - data fresh for 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes cache - longer memory
            retry: 1, // Only retry once for faster failure
            retryDelay: 500, // 500ms retry delay (faster)
            refetchOnWindowFocus: false,
            refetchOnMount: true, // Refetch on mount for fresh data
            refetchOnReconnect: true, // Refetch when internet reconnects
            networkMode: 'online', // Only fetch when online
          },
          mutations: {
            retry: false,
            networkMode: 'online',
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
