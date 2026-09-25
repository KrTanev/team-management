import type { ReactNode } from "react";

export const ContentWrapper = ({ children }: { children?: ReactNode }) => (
  <main className="ml-60 min-h-screen px-8 pt-20 pb-10">
    <div className="mx-auto max-w-6xl">{children}</div>
  </main>
);

export default ContentWrapper;
