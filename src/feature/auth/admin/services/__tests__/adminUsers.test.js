import { describe, expect, it, vi, beforeEach } from "vitest";
import axiosAdmin from "../../untils/axiosAdmin";
import {
  approvePackageRequest,
  getPackageRequests,
  rejectPackageRequest,
} from "../adminUsers";

vi.mock("../../untils/axiosAdmin", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin package request services", () => {
  it("loads pending package requests", async () => {
    axiosAdmin.get.mockResolvedValueOnce({ data: [{ id: "req-1" }] });

    await expect(getPackageRequests()).resolves.toEqual([{ id: "req-1" }]);

    expect(axiosAdmin.get).toHaveBeenCalledWith("/user/package-request/pending");
  });

  it("approves and rejects package requests", async () => {
    axiosAdmin.patch.mockResolvedValue({ data: { ok: true } });

    await approvePackageRequest("req-1");
    await rejectPackageRequest("req-2");

    expect(axiosAdmin.patch).toHaveBeenCalledWith(
      "/user/package-request/req-1/approve",
    );
    expect(axiosAdmin.patch).toHaveBeenCalledWith(
      "/user/package-request/req-2/reject",
    );
  });
});
