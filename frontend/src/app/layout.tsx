import React from 'react';
import './globals.css';
import { Navbar } from '../components/navbar';

export const metadata = {
  title: 'RevPulse AI | Razorpay AI Buildathon Submission',
  description: 'Autonomous Bounded Revenue Recovery Agent for Razorpay merchants.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-border py-4 text-center text-xs text-gray-500">
          RevPulse AI — Submitted for Razorpay AI Buildathon (AI Revenue Recovery Track)
        </footer>
      </body>
    </html>
  );
}
