import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MainLayout from "../MainLayout";

afterEach(cleanup);

describe("MainLayout — điều hướng phần thông tin người dùng", () => {
  it("bấm vào avatar/tên người dùng thì sang trang /info", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<div>TRANG CHỦ</div>} />
            <Route path="/info" element={<div>TRANG THÔNG TIN</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("TRANG CHỦ")).toBeTruthy();

    fireEvent.click(screen.getByText("Nguyen Van A"));

    expect(screen.getByText("TRANG THÔNG TIN")).toBeTruthy();
  });
});
