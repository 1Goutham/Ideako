import type { Metadata } from "next";
import { VoiceView } from "@/components/app/VoiceView";

export const metadata: Metadata = { title: "Voice" };

export default function VoicePage() {
  return <VoiceView />;
}
