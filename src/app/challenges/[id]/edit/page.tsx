import { notFound } from "next/navigation";

import { Card, PageHeader } from "@/components/ui";
import { t } from "@/config";
import { requireUser } from "@/lib/auth";
import { asValues } from "@/lib/fields";
import { canManageChallenge } from "@/lib/permissions";
import { getChallenge } from "@/lib/queries";
import { toDateInput } from "@/lib/utils";

import { updateChallenge } from "../../actions";
import { ChallengeForm } from "../../challenge-form";

export default async function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/challenges/${id}/edit`);
  const c = await getChallenge(id);
  if (!c || !canManageChallenge(user, c)) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${t.challenge.singular.toLowerCase()}`} />
      <Card>
        <ChallengeForm
          action={updateChallenge.bind(null, id)}
          submitLabel="Save changes"
          initial={{ ...c, deadline: toDateInput(c.deadline), fields: asValues(c.fields) }}
        />
      </Card>
    </div>
  );
}
