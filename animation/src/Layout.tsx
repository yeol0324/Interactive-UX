import { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
  isPending: boolean;
};
export default function Layout({ children, isPending }: LayoutProps) {
  return (
    <div className="layout">
      <section
        className="header"
        style={{
          opacity: isPending ? 0.7 : 1,
        }}
      ></section>
      <main>{children}</main>
    </div>
  );
}
