import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AppLayout } from './shared/components/AppLayout';
import { HomeView } from './features/brewing/HomeView';
import { BrewStationView } from './features/brewing/BrewStationView';
import { WikiIndexView } from './features/wiki/WikiIndexView';
import { WikiEntryView } from './features/wiki/WikiEntryView';
import { FlavorWheelView } from './features/flavor-wheel/FlavorWheelView';
import { NotFoundView } from './shared/components/NotFoundView';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomeView />} />
        <Route path="brew/:methodSlug" element={<BrewStationView />} />
        <Route path="wiki" element={<WikiIndexView />} />
        <Route path="wiki/:category/:entrySlug" element={<WikiEntryView />} />
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
