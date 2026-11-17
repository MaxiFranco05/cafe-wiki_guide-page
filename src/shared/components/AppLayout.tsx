import React from 'react';
import { Outlet } from 'react-router';
import { TopNavbar } from './TopNavbar';
import { BottomTabBar } from './BottomTabBar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-canvas text-text-primary antialiased selection:bg-accent selection:text-text-on-accent">
      <TopNavbar />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-6 md:px-9 md:py-8 pb-24 md:pb-16">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
};
