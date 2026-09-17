import type { Metadata, Viewport } from "next";
import { Anonymous_Pro, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { WorkspaceProvider } from "@/lib/store";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-outfit",
  display: "swap",
});

const mono = Anonymous_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono-ap",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Ideako — Your AI creative partner", template: "%s · Ideako" },
  description: "Ideako learns how you communicate and helps you create social media content in your own voice.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#efeeea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <WorkspaceProvider>{children}</WorkspaceProvider>
        <Toaster
          position="bottom-center"
          mobileOffset={{ bottom: 24 }}
          toastOptions={{
            style: {
              background: "#111111",
              color: "#f5f3ef",
              border: "none",
              borderRadius: 999,
              fontFamily: "var(--font-outfit)",
              fontSize: 13,
              padding: "12px 18px",
            },
          }}
        />
      </body>
    </html>
  );
}
