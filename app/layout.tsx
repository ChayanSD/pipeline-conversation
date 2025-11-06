import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import BackgroundWrapper from "@/components/BackgroundWrapper";


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
          <ThemeProvider>
            <BackgroundWrapper>
              <div className="flex min-h-screen h-screen">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>
            </BackgroundWrapper>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
