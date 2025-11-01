import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";
import ClientLayout from "@/components/ClientLayout";


export const metadata: Metadata = {
  title: "Pipeline Conversation",
  description: "Simple Quiz App that summarizes you in a few questions",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <ClientLayout session={session}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
