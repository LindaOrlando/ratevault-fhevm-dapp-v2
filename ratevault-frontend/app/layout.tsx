import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { NetworkWarning } from "@/components/NetworkWarning";

export const metadata: Metadata = {
  title: "RateVault - Privacy-First Rating Platform",
  description: "Multi-Dimensional Rating Platform powered by FHEVM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Navbar />
          <NetworkWarning />
          {children}
        </Providers>
      </body>
    </html>
  );
}

