import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AppLayout } from './shared/components/AppLayout';
import { HomeView } from './features/brewing/HomeView';

const BrewStationView = lazy(() =>
  import('./features/brewing/BrewStationView').then((m) => ({ default: m.BrewStationView }))
);
const WikiHomeView = lazy(() =>
  import('./features/wiki/views/WikiHomeView').then((m) => ({ default: m.WikiHomeView }))
);
const WikiSectionView = lazy(() =>
  import('./features/wiki/views/WikiSectionView').then((m) => ({ default: m.WikiSectionView }))
);
const WikiEntryDetailView = lazy(() =>
  import('./features/wiki/views/WikiEntryDetailView').then((m) => ({
    default: m.WikiEntryDetailView,
  }))
);
const FlavorWheelView = lazy(() =>
  import('./features/flavor-wheel/views/FlavorWheelView').then((m) => ({
    default: m.FlavorWheelView,
  }))
);
const NotFoundView = lazy(() =>
  import('./shared/components/NotFoundView').then((m) => ({ default: m.NotFoundView }))
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomeView />} />
        <Route path="brew/:methodSlug" element={<BrewStationView />} />
        <Route path="wiki" element={<WikiHomeView />} />
        <Route path="wiki/:section" element={<WikiSectionView />} />
        <Route path="wiki/:section/:entrySlug" element={<WikiEntryDetailView />} />
        <Route path="flavor-wheel" element={<FlavorWheelView />} />
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
