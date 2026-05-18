import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nutcracker Tracker",
  description: "A refined venue discovery dashboard",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role || (user ? "member" : undefined);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && supportDark)) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${outfit.className} min-h-screen relative overflow-x-hidden antialiased`}>
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/40 blur-[150px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/30 blur-[150px] rounded-full pointer-events-none" />

        <Navigation userRole={role} />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
