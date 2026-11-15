import type { Metadata } from "next";

import { Card, PageHeader } from "@/components/ui";
import { config, t } from "@/config";
import { requireUser } from "@/lib/auth";
import { canCreateChallenge } from "@/lib/permissions";

import { createChallenge } from "../actions";
import { ChallengeForm } from "../challenge-form";

export const metadata: Metadata = { title: `New ${t.challenge.singular.toLowerCase()}` };

export default async function NewChallengePage() {
  const user = await requireUser("/challenges/new");
  if (!canCreateChallenge(user)) {
    const pending = user.role === "owner" && !user.approved;
    return (
      <Card className="mx-auto max-w-lg text-sm">
        {pending
          ? `Your ${config.roles.owner.label.toLowerCase()} account is awaiting admin approval. You'll be able to post once approved.`
          : `Only ${config.permissions.createChallenge.map((r) => config.roles[r].plural.toLowerCase()).join(" and ")} can post ${t.challenge.plural.toLowerCase()}.`}
      </Card>
    );
  }
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Post a ${t.challenge.singular.toLowerCase()}`} />
      <Card>
        <ChallengeForm action={createChallenge} submitLabel={`Publish ${t.challenge.singular.toLowerCase()}`} />
      </Card>
    </div>
  );
}
