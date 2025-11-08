'use client';

import { UserProvider } from "@/contexts/UserContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { SessionUser } from "@/lib/session";
import Navbar from "@/components/Navbar";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useLoading } from "@/contexts/LoadingContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, loadingMessage } = useLoading();

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </>
  );
}

interface ClientLayoutProps {
  children: React.ReactNode;
  session: SessionUser | null;
}

export default function ClientLayout({ children, session }: ClientLayoutProps) {
  return (
    <UserProvider user={session}>
      <LoadingProvider>
        <LayoutContent>{children}</LayoutContent>
      </LoadingProvider>
    </UserProvider>
  );
}