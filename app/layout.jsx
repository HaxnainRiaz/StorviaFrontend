import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayoutShell from "@/components/layout/ClientLayoutShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "StorVia | Admin Panel",
  description: "Administrative dashboard for StorVia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} antialiased bg-[#FDFCFB]`} suppressHydrationWarning>
        <Providers>
          <ClientLayoutShell>
            {children}
          </ClientLayoutShell>
        </Providers>
      </body>
    </html>
  );
}
