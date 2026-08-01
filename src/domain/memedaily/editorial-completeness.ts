/**
 * input: a parsed v4 meme envelope and its independently derived selected-tier count
 * output: deterministic research-pass and editorial-completeness issues
 * pos: pure v4 completeness gate composed by dynamic-selection
 */
import {
  MEME_EDITORIAL_POLICY_VERSION,
  type DailyEnvelope,
} from "./schema";

const MINIMUM_INITIAL_CANDIDATES = 30;
const MINIMUM_SECOND_PASS_CANDIDATES = 45;
const MINIMUM_SECOND_PASS_ADDITIONS = 15;
const EXACT_THREE = 3;

type Selection = NonNullable<DailyEnvelope["run_report"]["selection"]>;
type CandidateAudit = Selection["candidate_audit"][number];
type ResearchPass = NonNullable<Selection["research_passes"]>[number];

function mismatchIssue(
  date: string,
  label: string,
  actual: number,
  expected: number,
): string[] {
  if (actual === expected) return [];
  return [`${date} ${label} ${actual} does not equal ${expected}`];
}

function minimumIssue(
  date: string,
  label: string,
  actual: number,
  minimum: number,
): string[] {
  if (actual >= minimum) return [];
  return [`${date} ${label} requires >=${minimum}; received ${actual}`];
}

function passSequenceIssues(date: string, passes: ResearchPass[]): string[] {
  return passes.flatMap((pass, index) => {
    const expected = index + 1;
    if (pass.pass === expected) return [];
    return [`${date} research pass ${pass.pass} must be sequential pass ${expected}`];
  });
}

function passMembershipIssues(
  audit: CandidateAudit[],
  passes: ResearchPass[],
): string[] {
  const declared = new Set(passes.map((pass) => pass.pass));
  return audit.flatMap((row) => {
    if (row.research_pass === undefined) {
      return [`${row.candidate_key} is missing research_pass for v4`];
    }
    if (declared.has(row.research_pass)) return [];
    return [`${row.candidate_key} references undeclared research_pass ${row.research_pass}`];
  });
}

function passAccountingIssues(
  date: string,
  audit: CandidateAudit[],
  passes: ResearchPass[],
): string[] {
  let cumulative = 0;
  return passes.flatMap((pass) => {
    cumulative += pass.candidates_added;
    const added = audit.filter((row) => row.research_pass === pass.pass).length;
    return [
      ...mismatchIssue(
        date, `research pass ${pass.pass} candidates_added`, added, pass.candidates_added,
      ),
      ...mismatchIssue(
        date, `research pass ${pass.pass} cumulative`,
        pass.cumulative_unique_candidates, cumulative,
      ),
    ];
  });
}

function finalCountIssues(
  envelope: DailyEnvelope,
  audit: CandidateAudit[],
  passes: ResearchPass[],
): string[] {
  const finalCount = passes.at(-1)?.cumulative_unique_candidates;
  if (finalCount === undefined) return [`${envelope.date} v4 selection is missing research_passes`];
  return [
    ...mismatchIssue(
      envelope.date, "research final vs candidates_scanned",
      finalCount, envelope.run_report.candidates_scanned,
    ),
    ...mismatchIssue(envelope.date, "research final vs candidate_audit", finalCount, audit.length),
  ];
}

function exactThreeIssues(
  envelope: DailyEnvelope,
  qualifiedAtSelectedTier: number,
  passes: ResearchPass[],
): string[] {
  if (qualifiedAtSelectedTier !== EXACT_THREE) return [];
  return [
    ...(passes.length >= 2
      ? []
      : [`${envelope.date} exactly 3 qualified items require a second research pass`]),
    ...(envelope.run_report.candidates_scanned >= MINIMUM_SECOND_PASS_CANDIDATES
      ? []
      : [`${envelope.date} exactly 3 qualified items require >=45 unique candidates`]),
    ...secondPassDepthIssues(envelope.date, passes),
  ];
}

function secondPassDepthIssues(date: string, passes: ResearchPass[]): string[] {
  const first = passes[0];
  const second = passes[1];
  if (!first || !second) return [];
  return [
    ...minimumIssue(
      date,
      "second research pass candidates_added",
      second.candidates_added,
      MINIMUM_SECOND_PASS_ADDITIONS,
    ),
    ...sourceScopeExpansionIssues(date, first, second),
  ];
}

function sourceScopeExpansionIssues(
  date: string,
  first: ResearchPass,
  second: ResearchPass,
): string[] {
  const initialScopes = new Set(first.sources_checked);
  const hasNewScope = second.sources_checked.some((scope) => !initialScopes.has(scope));
  if (hasNewScope) return [];
  return [`${date} second research pass must add a source scope not checked in pass 1`];
}

function completeDeclarationIssues(date: string, complete: boolean | undefined): string[] {
  if (complete === true) return [];
  return [`${date} v4 selection requires editorial_complete=true`];
}

function validSelection(
  envelope: DailyEnvelope,
  qualifiedAtSelectedTier: number | undefined,
): Selection | undefined {
  if (!envelope.run_report.selection) return undefined;
  if (qualifiedAtSelectedTier === undefined) return undefined;
  return envelope.run_report.selection;
}

function researchPasses(selection: Selection): ResearchPass[] {
  return selection.research_passes ?? [];
}

function initialPassIssues(date: string, passes: ResearchPass[]): string[] {
  const count = passes[0]?.cumulative_unique_candidates ?? 0;
  return minimumIssue(
    date, "first research pass unique candidates", count, MINIMUM_INITIAL_CANDIDATES,
  );
}

export function editorialCompletenessIssues(
  envelope: DailyEnvelope,
  qualifiedAtSelectedTier: number | undefined,
): string[] {
  if (envelope.policy_version !== MEME_EDITORIAL_POLICY_VERSION) return [];
  const selection = validSelection(envelope, qualifiedAtSelectedTier);
  if (!selection) {
    return [`${envelope.date} v4 selection accounting is missing`];
  }
  const passes = researchPasses(selection);
  return [
    ...completeDeclarationIssues(envelope.date, selection.editorial_complete),
    ...passSequenceIssues(envelope.date, passes),
    ...passMembershipIssues(selection.candidate_audit, passes),
    ...passAccountingIssues(envelope.date, selection.candidate_audit, passes),
    ...finalCountIssues(envelope, selection.candidate_audit, passes),
    ...initialPassIssues(envelope.date, passes),
    ...exactThreeIssues(envelope, qualifiedAtSelectedTier!, passes),
  ];
}
