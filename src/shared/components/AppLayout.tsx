import React from 'react';
import { Outlet } from 'react-router';
import { TopNavbar } from './TopNavbar';
import { BottomTabBar } from './BottomTabBar';

export const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-canvas text-text-primary antialiased selection:bg-accent selection:text-text-on-accent overflow-x-clip">
      {/* Pure HTML + CSS Ambient Coffee Backdrop (Fondo 2: Ondas de Crema + Granos Esculpidos, zero img/svg/url) */}
      <div className="app-bg-decor bg-layer-beans" aria-hidden="true">
        <div className="css-crema-wave css-crema-wave--primary" />
        <div className="css-crema-wave css-crema-wave--secondary" />
        <div className="css-bean css-bean--tl" />
        <div className="css-bean css-bean--tr" />
        <div className="css-bean css-bean--bl" />
        <div className="css-bean css-bean--br" />
      </div>
      <TopNavbar />
      <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-4 py-6 md:px-9 md:py-8 pb-24 md:pb-16">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
};
