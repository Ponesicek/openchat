"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type ReactQueryProviderProps = {
  children: React.ReactNode;
};

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
