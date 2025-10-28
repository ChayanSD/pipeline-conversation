import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";


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
    <html lang="en" >
      <body >
        <UserProvider user={session}>
          <div className="flex h-screen ">
            <Sidebar />
            <main className="flex-1 overflow-auto ">
              {children}
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
