import { notFound } from "next/navigation";

import { Card, PageHeader } from "@/components/ui";
import { t } from "@/config";
import { requireUser } from "@/lib/auth";
import { asValues } from "@/lib/fields";
import { canEditSubmission } from "@/lib/permissions";
import { getChallenge, getSubmission } from "@/lib/queries";

import { updateSubmission } from "../../actions";
import { SubmissionForm } from "../../submission-form";

export default async function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/submissions/${id}/edit`);
  const s = await getSubmission(id);
  const c = s ? await getChallenge(s.challengeId) : null;
  if (!s || !c || !canEditSubmission(user, c, s)) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${t.submission.singular.toLowerCase()}`} subtitle="Saving re-runs the AI evaluation." />
      <Card>
        <SubmissionForm action={updateSubmission.bind(null, id)} submitLabel="Save changes" initial={{ title: s.title, summary: s.summary, fields: asValues(s.fields) }} />
      </Card>
    </div>
  );
}
