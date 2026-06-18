import { describe, it, expect, beforeEach } from "vitest";
import {
  setTokens,
  getAccessToken,
  clearTokens,
} from "../tokenStorage";

beforeEach(() => {
  localStorage.clear();
});

describe("tokenStorage", () => {
  it("setTokens stores only the access token", () => {
    setTokens({ accessToken: "acc-1", refreshToken: "should-be-ignored" });
    expect(getAccessToken()).toBe("acc-1");
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("clearTokens removes the access token", () => {
    setTokens({ accessToken: "acc-1" });
    clearTokens();
    expect(getAccessToken()).toBeNull();
  });
});
