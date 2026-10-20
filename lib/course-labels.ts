/** Short names for the filter buttons and card corners. Unknown programs drop the "BS " prefix. */
const SHORT_LABELS: Record<string, string> = {
  "BS Information Technology": "IT",
  "BS Computer Science": "CS",
};

export function courseLabel(courseName: string): string {
  return SHORT_LABELS[courseName] ?? courseName.replace(/^BS\s+/, "");
}
