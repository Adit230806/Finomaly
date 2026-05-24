import { createFileRoute, redirect } from "@tanstack/react-router";

/** Analytics consolidated into admin command center */
export const Route = createFileRoute("/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/admin-dashboard" });
  },
  component: () => null,
});
