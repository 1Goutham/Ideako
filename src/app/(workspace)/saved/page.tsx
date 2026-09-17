import type { Metadata } from "next";
import { SavedView } from "@/components/app/SavedView";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage() {
  return <SavedView />;
}
