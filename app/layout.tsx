import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classroom | Student Performance",
  description: "Manage student records, subjects, marks and class performance.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
