import { describe, it, expect } from "vitest";

// Mirrors the regex used in the transactions API route
const CUSTOMER_NO_REGEX = /^[0-9a-zA-Z|]+$/;

describe("customerNo validation", () => {
  it.each([
    ["08123456789", true],
    ["123456789|1234", true],   // ML format UserID|ServerID
    ["ABC123", true],
    ["123456", true],
  ])("accepts valid: %s", (input, expected) => {
    expect(CUSTOMER_NO_REGEX.test(input)).toBe(expected);
  });

  it.each([
    ["", false],
    ["081 234", false],         // spaces not allowed
    ["user@domain", false],     // @ not allowed
    ["123-456", false],         // dash not allowed
    ["<script>", false],
  ])("rejects invalid: %s", (input, expected) => {
    expect(CUSTOMER_NO_REGEX.test(input)).toBe(expected);
  });
});