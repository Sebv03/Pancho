import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LicitIA - Dashboard de Licitaciones con IA",
  description: "Plataforma personal para gestión y análisis inteligente de licitaciones públicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
