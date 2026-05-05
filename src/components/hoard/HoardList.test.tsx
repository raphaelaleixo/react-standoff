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

  it("renders one card per banknote", () => {
    render(<HoardList loot={loot} />);
    expect(screen.getByText("$20,000")).toBeInTheDocument();
    expect(screen.getAllByText("$10,000")).toHaveLength(2);
    expect(screen.getAllByText("$5,000")).toHaveLength(2);
  });

  it("renders the section header", () => {
    render(<HoardList loot={loot} />);
    expect(screen.getByText("On the Table")).toBeInTheDocument();
    expect(screen.getByText("the captain's hoard")).toBeInTheDocument();
  });

  it("renders an empty list when loot is empty", () => {
    render(<HoardList loot={[]} />);
    expect(screen.getByText("On the Table")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });
});
