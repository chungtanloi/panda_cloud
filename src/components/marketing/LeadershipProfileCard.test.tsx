import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeadershipProfileCard } from "./LeadershipProfileCard";
import { LEADERSHIP_PROFILES } from "@/config/about";

describe("LeadershipProfileCard", () => {
  it("renders the approved profile content and safe LinkedIn link", () => {
    const profile = LEADERSHIP_PROFILES[0]!;

    render(<LeadershipProfileCard profile={profile} />);

    expect(screen.getByRole("heading", { name: profile.name })).toBeInTheDocument();
    expect(screen.getByText("Chief Executive Officer")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: profile.portraitAlt })).toBeInTheDocument();
    expect(screen.queryByText(/sample profile|portrait pending/i)).not.toBeInTheDocument();

    const link = screen.getByRole("link", { name: "View LinkedIn profile" });
    expect(link).toHaveAttribute("href", profile.linkedinUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keeps the three approved leadership roles configurable as data", () => {
    expect(LEADERSHIP_PROFILES).toHaveLength(3);
    expect(LEADERSHIP_PROFILES.map((profile) => profile.role)).toEqual([
      "Chief Executive Officer",
      "Chief Executive Officer",
      "Chief Executive Officer",
    ]);
  });
});
