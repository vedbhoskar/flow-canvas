// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudioClient from "../../src/app/studio/studio-client";

describe("studio shell", () => {
  it("shows the taskbar, module library, canvas, inspector and timeline", () => {
    render(<StudioClient />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: /search modules/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main", { name: /canvas/i })).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: /inspector/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /timeline/i }),
    ).toBeInTheDocument();
  });

  it("filters the module list", async () => {
    render(<StudioClient />);
    await userEvent.type(
      screen.getByRole("searchbox", { name: /search modules/i }),
      "database",
    );
    expect(screen.getByText("Database")).toBeInTheDocument();
    expect(screen.queryByText("Resource Pool")).not.toBeInTheDocument();
  });

  it("renames a project and undoes it", async () => {
    render(<StudioClient />);
    const title = screen.getByRole("textbox", { name: /project name/i });
    await userEvent.clear(title);
    await userEvent.type(title, "My Diagram{Enter}");
    expect(title).toHaveValue("My Diagram");
    await userEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(title).toHaveValue("Untitled project");
    await userEvent.click(screen.getByRole("button", { name: /redo/i }));
    expect(title).toHaveValue("My Diagram");
  });

  it("keeps panel toggles discoverable and focusable", async () => {
    render(<StudioClient />);
    const modulesToggle = screen.getByRole("button", {
      name: /toggle modules/i,
    });
    await userEvent.click(modulesToggle);
    expect(
      screen.queryByRole("complementary", { name: /modules/i }),
    ).not.toBeInTheDocument();
    expect(modulesToggle).toHaveAttribute("aria-expanded", "false");
    expect(modulesToggle).toHaveFocus();
    await userEvent.click(modulesToggle);
    expect(
      screen.getByRole("complementary", { name: /modules/i }),
    ).toBeInTheDocument();

    const inspectorToggle = screen.getByRole("button", {
      name: /toggle inspector/i,
    });
    await userEvent.click(inspectorToggle);
    expect(
      screen.queryByRole("complementary", { name: /inspector/i }),
    ).not.toBeInTheDocument();
    expect(inspectorToggle).toHaveAttribute("aria-expanded", "false");
  });

  it("explains unfinished controls and prevents activating them", () => {
    render(<StudioClient />);
    expect(screen.getByRole("button", { name: /undo/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /play/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /play/i })).toHaveAttribute(
      "title",
      "Playback is under construction",
    );
  });
});
