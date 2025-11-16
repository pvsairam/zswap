import type { Metadata } from "next";
import { Patrick_Hand } from 'next/font/google';
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from 'react-hot-toast';

const patrickHand = Patrick_Hand({ 
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-patrick',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ZSwap - Encrypted Private Swaps",
  description: "Privacy-preserving decentralized exchange powered by Fully Homomorphic Encryption",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${patrickHand.variable} antialiased sketch-ui`}>
        <Providers>
          {children}
        </Providers>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
            success: {
              duration: 4000,
              iconTheme: {
                primary: 'hsl(var(--success))',
                secondary: 'hsl(var(--success-foreground))',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: 'hsl(var(--destructive))',
                secondary: 'hsl(var(--destructive-foreground))',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
