import "@/styles/globals.css";

import { type Metadata } from "next";

import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatsSidebar } from "@/components/chats-sidebar";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "OpenChat",
  description: "Open source chat app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
      <main >
        <TRPCReactProvider>
      <SidebarProvider>
      <ChatsSidebar />
        <div className="w-full"  >
        {children}
        </div> 
    </SidebarProvider>
    </TRPCReactProvider>
      </main>
      </body>
    </html>
  );
}