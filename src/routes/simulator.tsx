import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy /simulator → unified user simulation dashboard */
export const Route = createFileRoute("/simulator")({
  beforeLoad: () => {
    throw redirect({ to: "/user-dashboard" });
  },
  component: () => null,
});
