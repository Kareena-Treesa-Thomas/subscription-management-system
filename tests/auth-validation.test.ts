import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "../src/lib/validation";

describe("authentication validation", () => {
  it("normalizes email casing", () => {
    expect(loginSchema.parse({ email: "  Ammalu@Brightloop.Test ", password: "Admin@12345" }).email)
      .toBe("ammalu@brightloop.test");
  });

  it("rejects weak passwords with the unmet requirements", () => {
    const result = signupSchema.safeParse({
      name: "Ammalu",
      email: "ammalu@brightloop.test",
      password: "weak",
      confirmPassword: "weak",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toEqual([
        "At least 10 characters",
        "One uppercase letter",
        "One number",
        "One special character",
      ]);
    }
  });

  it("accepts a strong matching password", () => {
    expect(signupSchema.safeParse({
      name: "Ammalu",
      email: "ammalu@brightloop.test",
      password: "Admin@12345",
      confirmPassword: "Admin@12345",
    }).success).toBe(true);
  });

  it("reports password confirmation mismatches", () => {
    const result = signupSchema.safeParse({
      name: "Ammalu",
      email: "ammalu@brightloop.test",
      password: "Admin@12345",
      confirmPassword: "Admin@12346",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toEqual(["Passwords do not match"]);
    }
  });
});
