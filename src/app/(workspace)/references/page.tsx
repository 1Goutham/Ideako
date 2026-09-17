import type { Metadata } from "next";
import { ReferencesView } from "@/components/app/ReferencesView";

export const metadata: Metadata = { title: "References" };

export default function ReferencesPage() {
  return <ReferencesView />;
}
