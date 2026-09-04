import type { ZodError } from "zod";

export interface ZodIssueInfo {
  field: string;
  message: string;
}

export function formatZodIssues(error: ZodError): ZodIssueInfo[] {
  return error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}