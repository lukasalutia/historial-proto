import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = { title: "Salutia — Historial" };
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2b4c9c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body className="h-full bg-[#e2e8f0] flex items-start justify-center md:items-center md:min-h-screen">
        <div className="w-full max-w-[393px] min-h-dvh bg-white relative overflow-hidden shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
