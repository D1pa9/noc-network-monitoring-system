import type { ReactNode } from "react";
import TopBar from "./TopBar";

interface Props {
  title: string;
  lastUpdated: Date | null;
  children: ReactNode;
}

export default function Layout({ title, lastUpdated, children }: Props) {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <TopBar title={title} lastUpdated={lastUpdated} />
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        {children}
      </main>
    </div>
  );
}