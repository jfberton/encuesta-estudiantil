import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Encuesta de Opinión Estudiantil – Cátedra",
  description: "Encuesta de opinión anónima para alumnos de la cátedra de Matemática Financiera - Facultad de Ciencias Económicas UNNE",
  icons: {
    icon: [
      { url: "/fce-round.png?v=20261028", sizes: "any", type: "image/png" },
    ],
    shortcut: "/fce-round.png?v=20261028",
    apple: "/fce-round.png?v=20261028",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${sansFont.variable} font-sans antialiased`}>
      <body className="min-h-screen bg-[#FAF9F5] text-stone-800 selection:bg-stone-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
