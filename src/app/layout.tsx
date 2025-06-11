
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import AiChatModal from '@/components/chat/AiChatModal';
import ClickSpark from '@/components/ClickSpark'; // Import ClickSpark

export const metadata: Metadata = {
  title: 'MintFire - Pioneering Future Technology',
  description: 'MintFire specializes in Cyber Security, Blockchain, AI, Industrial Software, and IoT Devices.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <ThemeProvider>
          <ClickSpark 
            sparkColor="hsl(var(--accent))" // Use accent color (Neon Green)
            sparkCount={12}
            sparkRadius={25}
            duration={600}
            extraScale={1.1}
          >
            {/* This div ensures ClickSpark's internal div (w-full h-full) expands correctly and manages layout */}
            <div className="flex flex-col min-h-screen">
              <div className="scanline-overlay" />
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
              <Footer />
            </div>
          </ClickSpark>
          {/* Fixed/overlay elements outside ClickSpark wrapper */}
          <AiChatModal />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
