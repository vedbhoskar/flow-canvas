import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flow Canvas",
  description: "Build, simulate, and present interactive system diagrams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
