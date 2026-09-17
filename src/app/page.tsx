import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Ideako — Content that sounds like you",
};

export default function Home() {
  return <Landing />;
}
