import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import { Header } from '@/components/Header';
import { SideMenu } from '@/components/SideMenu';
import { BottomNav } from '@/components/BottomNav';
import { Player } from '@/components/Player';
import { RecordFAB } from '@/components/RecordFAB';
import { LoginModal } from '@/components/LoginModal';

import { DescubriPage } from '@/pages/DescubriPage';
import { AsambleaPage } from '@/pages/AsambleaPage';
import { GrabarPage } from '@/pages/GrabarPage';
import { ArchivoPage } from '@/pages/ArchivoPage';
import { InteraccionesPage } from '@/pages/InteraccionesPage';
import { PerfilPage, ComunidadPage, RedPanalPage } from '@/pages/OtherPages';
import { SearchPage } from '@/pages/SearchPage';

function Layout() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Header />
      <SideMenu />
      <main className="pt-16">
        <Outlet />
      </main>
      <Player />
      <RecordFAB />
      <BottomNav />
      <LoginModal />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DescubriPage />} />
          <Route path="/descubri" element={<DescubriPage />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/grabar" element={<GrabarPage />} />
          <Route path="/asamblea" element={<AsambleaPage />} />
          <Route path="/interacciones" element={<InteraccionesPage />} />
          <Route path="/comunidad" element={<ComunidadPage />} />
          <Route path="/about" element={<RedPanalPage />} />
          {/* /:username/:slug must come before /:username */}
          <Route path="/:username/:slug" element={<ArchivoPage />} />
          <Route path="/:username" element={<PerfilPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
