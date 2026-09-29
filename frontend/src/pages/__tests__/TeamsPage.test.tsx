import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderApp } from "../../test/renderApp";

describe("Teams", () => {
  it("lists seeded teams", async () => {
    renderApp("/teams", { userId: 2 });
    expect(await screen.findByRole("link", { name: "Team Marvin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Team Orbit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New team" })).not.toBeInTheDocument();
  });

  it("shows New team for admins", async () => {
    renderApp("/teams", { userId: 1 });
    expect(await screen.findByRole("button", { name: "New team" })).toBeInTheDocument();
  });

  it("opens a team and lists its members", async () => {
    const user = userEvent.setup();
    renderApp("/teams", { userId: 1 });
    await user.click(await screen.findByRole("link", { name: "Team Marvin" }));
    const members = await screen.findByRole("list", { name: "Members" });
    expect(within(members).getAllByRole("listitem")).toHaveLength(3);
    expect(within(members).getByRole("button", { name: "Remove Bob Smith" })).toBeInTheDocument();
  });
});
