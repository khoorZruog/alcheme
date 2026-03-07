import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SideMenu } from "@/components/side-menu";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/inventory",
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: { uid: "u1", displayName: "Test", email: "test@example.com" },
    profile: null,
  }),
}));

vi.mock("firebase/auth", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/lib/firebase/client", () => ({
  auth: {},
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));

describe("SideMenu", () => {
  it("renders 3 main menu items plus 1 sub item", () => {
    render(<SideMenu open={true} onOpenChange={() => {}} />);
    const links = screen.getAllByRole("link");
    // 3 main items + 1 sub item (設定) = 4 links
    expect(links).toHaveLength(4);
  });

  it("does not render カレンダー entry", () => {
    render(<SideMenu open={true} onOpenChange={() => {}} />);
    expect(screen.queryByText("カレンダー")).toBeNull();
  });

  it("renders メイク日記 entry", () => {
    render(<SideMenu open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("メイク日記")).toBeDefined();
  });

  it("renders all expected menu labels", () => {
    render(<SideMenu open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("My Cosme")).toBeDefined();
    expect(screen.getByText("レシピ")).toBeDefined();
    expect(screen.getByText("メイク日記")).toBeDefined();
    expect(screen.getByText("設定")).toBeDefined();
  });
});
