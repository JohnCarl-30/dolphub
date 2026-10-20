/*
 * The opportunity form's values, all strings as the inputs hold them, and the
 * conversions to and from what the actions take. No server imports, so the
 * edit page and the client form share it.
 */
import type { CreateOpportunityInput, LocationType, OpportunityKind, PublicOpportunity } from "./services/opportunities";
import { isEndOfManilaDay, toManilaInput } from "./opportunity-time";

export interface OpportunityFormValues {
  kind: OpportunityKind;
  title: string;
  organization: string;
  summary: string;
  url: string;
  locationType: LocationType;
  location: string;
  /** "2026-10-30", Philippine time. */
  deadlineDate: string;
  /** "17:00", or empty for the end of the day. */
  deadlineTime: string;
  /** "2026-10-30T14:00", Philippine time, as a datetime-local input holds it. */
  startsAt: string;
  endsAt: string;
}

export const EMPTY_FORM: OpportunityFormValues = {
  kind: "internship",
  title: "",
  organization: "",
  summary: "",
  url: "",
  locationType: "onsite",
  location: "",
  deadlineDate: "",
  deadlineTime: "",
  startsAt: "",
  endsAt: "",
};

/** Fills the form from a saved post. A deadline stored as the end of a day shows with no time. */
export function toFormValues(post: PublicOpportunity): OpportunityFormValues {
  const deadline = post.deadline ? toManilaInput(post.deadline) : "";
  return {
    kind: post.kind,
    title: post.title,
    organization: post.organization,
    summary: post.summary,
    url: post.url,
    locationType: post.locationType,
    location: post.location ?? "",
    deadlineDate: deadline.slice(0, 10),
    deadlineTime: post.deadline && !isEndOfManilaDay(post.deadline) ? deadline.slice(11) : "",
    startsAt: post.startsAt ? toManilaInput(post.startsAt) : "",
    endsAt: post.endsAt ? toManilaInput(post.endsAt) : "",
  };
}

/** What the create action takes. Empty dates stay empty, which the service reads as "none". */
export function toActionInput(values: OpportunityFormValues): Required<CreateOpportunityInput> {
  const deadline = values.deadlineDate
    ? values.deadlineTime
      ? `${values.deadlineDate}T${values.deadlineTime}`
      : values.deadlineDate
    : "";
  return {
    kind: values.kind,
    title: values.title,
    organization: values.organization,
    summary: values.summary,
    url: values.url,
    locationType: values.locationType,
    location: values.location,
    deadline,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
  };
}

/** Only the fields that differ from the saved post, as the update action asks. */
export function changedFields(
  initial: OpportunityFormValues,
  values: OpportunityFormValues,
): Partial<CreateOpportunityInput> {
  const before = toActionInput(initial);
  const after = toActionInput(values);
  const keys = Object.keys(after) as (keyof typeof after)[];
  return Object.fromEntries(keys.filter((key) => before[key] !== after[key]).map((key) => [key, after[key]]));
}
