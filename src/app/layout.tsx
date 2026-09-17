import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import { WorkspaceProvider } from "@/lib/store";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Ideako — Your AI creative partner", template: "%s · Ideako" },
  description: "Ideako learns how you communicate and helps you create social media content in your own voice.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#fafafb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <WorkspaceProvider>{children}</WorkspaceProvider>
        <Toaster
          position="bottom-center"
          mobileOffset={{ bottom: 84 }}
          toastOptions={{
            style: {
              background: "#14171a",
              color: "#fff",
              border: "none",
              fontFamily: "var(--font-montserrat)",
              fontSize: 13,
            },
          }}
        />
      </body>
    </html>
  );
}
