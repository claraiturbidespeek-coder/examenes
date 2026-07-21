import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "S-Peak",
  // Segunda capa del bloqueo de indexación, junto al X-Robots-Tag de
  // next.config.ts y al robots.txt de app/robots.ts.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* El aspecto se fija aquí, no en globals.css: fondo claro siempre, para
          que el texto oscuro de las páginas tenga contraste pase lo que pase con
          el tema del sistema. */}
      <body className="min-h-full flex flex-col bg-neutral-50 font-sans text-neutral-900">
        {children}
      </body>
    </html>
  );
}
