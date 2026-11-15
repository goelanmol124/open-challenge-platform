import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, PageHeader } from "@/components/ui";
import { t } from "@/config";
import { requireUser } from "@/lib/auth";
import { canSubmit } from "@/lib/permissions";
import { getChallenge } from "@/lib/queries";

import { createSubmission } from "../../../submissions/actions";
import { SubmissionForm } from "../../../submissions/submission-form";

export default async function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/challenges/${id}/submit`);
  const c = await getChallenge(id);
  if (!c) notFound();

  if (!canSubmit(user, c)) {
    return (
      <Card className="mx-auto max-w-lg text-sm">
        You can&apos;t submit to this {t.challenge.singular.toLowerCase()} right now.{" "}
        <Link href={`/challenges/${id}`} className="text-brand underline">
          Back
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Submit a ${t.submission.singular.toLowerCase()}`}
        subtitle={
          <>
            to{" "}
            <Link href={`/challenges/${id}`} className="underline">
              {c.title}
            </Link>
          </>
        }
      />
      <Card>
        <SubmissionForm action={createSubmission.bind(null, id)} submitLabel={`Submit ${t.submission.singular.toLowerCase()}`} />
      </Card>
    </div>
  );
}
