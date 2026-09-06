export const API = {
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
  endpoints: {
    campaigns: "/api/v1/campaigns",
    campaign: (id: string) => `/api/v1/campaigns/${id}`,
    leads: "/api/v1/leads",
    lead: (id: string) => `/api/v1/leads/${id}`,
    templates: "/api/v1/templates",
    template: (id: string) => `/api/v1/templates/${id}`,
    analytics: "/api/v1/analytics",
    health: "/api/v1/health",
  },
} as const;