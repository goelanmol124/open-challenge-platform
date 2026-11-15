/** Evaluate pending/failed submissions from the command line (same as the cron endpoint). */
import "./load-env";

import { evaluatePending } from "@/lib/ai/evaluate";
import { pool } from "@/lib/db";

const limit = Number(process.argv[2] ?? 50);

evaluatePending(Number.isFinite(limit) ? limit : 50)
  .then((r) => console.log(r))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
