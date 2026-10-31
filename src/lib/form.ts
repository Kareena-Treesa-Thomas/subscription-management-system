import type { ZodTypeAny } from "zod";

export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  devLink?: string;
};

/** Client-side validation with the same Zod schema the server uses. */
export function validateForm(schema: ZodTypeAny, form: HTMLFormElement) {
  const result = schema.safeParse(Object.fromEntries(new FormData(form)));
  return result.success ? {} : (result.error.flatten().fieldErrors as Record<string, string[]>);
}
