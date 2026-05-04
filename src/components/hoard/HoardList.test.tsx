import { render, screen } from "@testing-library/react";
import { HoardList } from "./HoardList";

describe("HoardList", () => {
  const loot = [
    { value: 20000 as const },
    { value: 10000 as const },
    { value: 10000 as const },
    { value: 5000 as const },
    { value: 5000 as const },
  ];

  it("renders one row per banknote", () => {
    render(<HoardList loot={loot} />);
    expect(screen.getAllByText(/PIECE|DOUBLOON/)).toHaveLength(5);
  });

  it("renders the total", () => {
    render(<HoardList loot={loot} />);
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("shows note count and carry-over count in the subline", () => {
    const withCarry = [...loot, { value: 5000 as const, carryFromRound: 2 }];
    render(<HoardList loot={withCarry} />);
    expect(screen.getByText(/6 NOTES/)).toBeInTheDocument();
    expect(screen.getByText(/1 CARRY-OVER/)).toBeInTheDocument();
  });

  it("hides the carry-over fragment when there are none", () => {
    render(<HoardList loot={loot} />);
    expect(screen.queryByText(/CARRY-OVER/)).not.toBeInTheDocument();
  });
});
