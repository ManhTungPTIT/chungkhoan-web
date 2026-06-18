import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import axios from "axios";
import axiosClient from "../axiosClient";

describe("axiosClient refresh-failure flow", () => {
  let originalLocation;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("accessToken", "expired-acc");
    originalLocation = window.location;
    delete window.location;
    window.location = { pathname: "/admin/user", href: "" };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  it("refreshes via bare axios (not the intercepted client)", async () => {
    const postSpy = vi
      .spyOn(axios, "post")
      .mockRejectedValue({ response: { status: 401 } });

    const rejected = axiosClient.interceptors.response.handlers[0].rejected;
    const err = {
      config: { headers: {}, url: "/some-protected" },
      response: { status: 401 },
    };

    await expect(rejected(err)).rejects.toBeDefined();

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [url, , cfg] = postSpy.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/refresh$/);
    expect(cfg).toMatchObject({ withCredentials: true });
  });

  it("on refresh 401, clears tokens and redirects without hanging", async () => {
    vi.spyOn(axios, "post").mockRejectedValue({ response: { status: 401 } });

    const rejected = axiosClient.interceptors.response.handlers[0].rejected;
    const err = {
      config: { headers: {}, url: "/some-protected" },
      response: { status: 401 },
    };

    await expect(rejected(err)).rejects.toBeDefined();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(window.location.href).toBe("/admin/login");
  });
});
