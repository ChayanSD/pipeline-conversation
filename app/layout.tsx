import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReactQueryProvider } from "@/lib/react-query";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import { Toaster } from "react-hot-toast";


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
        <ReactQueryProvider>
          <UserProvider user={session}>
            <ThemeProvider>
              <BackgroundWrapper>
                {session ? (
                  <div className="flex min-h-screen h-screen">
                    <Sidebar />
                    <main className="flex-1 overflow-auto">
                      {children}
                    </main>
                  </div>
                ) : (
                  <main className="min-h-screen">
                    {children}
                  </main>
                )}
              </BackgroundWrapper>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#fff',
                    color: '#333',
                    fontFamily: 'Acumin Variable Concept',
                  },
                  success: {
                    iconTheme: {
                      primary: '#16a34a',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#dc2626',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </ThemeProvider>
          </UserProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
