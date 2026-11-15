/**
 * Shape of the fictional demo data loaded by `npm run db:seed`.
 * Every preset ships one; all people, organisations and content are invented.
 * Custom fields you leave out are auto-filled with placeholder values.
 */
export type SeedFieldValues = Record<string, string | number | boolean | string[] | null>;

export type SeedData = {
  users: {
    key: string;
    name: string;
    /** Use example.com / example.org addresses only. */
    email: string;
    role: "owner" | "solver" | "admin";
    organization?: string;
    bio?: string;
    profile?: SeedFieldValues;
  }[];
  challenges: {
    key: string;
    ownerKey: string;
    title: string;
    summary: string;
    description: string;
    category: string;
    stage: string;
    /** Days from "now" (negative = in the past). */
    deadlineInDays?: number;
    reward?: string;
    fields?: SeedFieldValues;
    featured?: boolean;
  }[];
  submissions: {
    challengeKey: string;
    authorKey: string;
    title: string;
    summary: string;
    fields?: SeedFieldValues;
    status?: string;
    endorsedBy?: string[];
    upvotedBy?: string[];
  }[];
};

export function defineSeed(seed: SeedData): SeedData {
  return seed;
}
