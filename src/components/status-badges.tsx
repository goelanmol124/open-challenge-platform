import { getStage, getStatus } from "@/config";

import { Badge } from "./ui";

export function StageBadge({ stage }: { stage: string }) {
  const s = getStage(stage);
  return <Badge tone={s?.tone ?? "neutral"}>{s?.label ?? stage}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const s = getStatus(status);
  return <Badge tone={s?.tone ?? "neutral"}>{s?.label ?? status}</Badge>;
}
