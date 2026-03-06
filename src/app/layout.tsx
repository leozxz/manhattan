import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manhattan",
  description: "Gestão financeira pessoal via Open Finance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
