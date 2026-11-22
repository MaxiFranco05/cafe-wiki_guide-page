import React, { Suspense } from 'react';
import { Outlet } from 'react-router';
import { TopNavbar } from './TopNavbar';
import { BottomTabBar } from './BottomTabBar';
import { AppFooter } from './AppFooter';
import { PwaStatusToast } from './PwaStatusToast';

const RouteLoadingFallback: React.FC = () => (
  <div
    className="min-h-[60dvh] w-full flex items-center justify-center"
    aria-busy="true"
    aria-live="polite"
  >
    <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-accent motion-safe:animate-spin" />
  </div>
);

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
      <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-4 py-6 md:px-9 md:py-8 pb-8 md:pb-8">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <AppFooter />
      <PwaStatusToast />
      <BottomTabBar />
    </div>
  );
};
