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

import { useAppStore } from '@/store/appStore';

function App() {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'descubri': return <DescubriPage />;
      case 'comunidad': return <ComunidadPage />;
      case 'asamblea': return <AsambleaPage />;
      case 'interacciones': return <InteraccionesPage />;
      case 'perfil': return <PerfilPage />;
      case 'redpanal': return <RedPanalPage />;
      case 'grabar': return <GrabarPage />;
      case 'archivo': return <ArchivoPage />;
      default: return <DescubriPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Header />
      <SideMenu />
      <main className="pt-16">
        {renderPage()}
      </main>
      <Player />
      <RecordFAB />
      <BottomNav />
      <LoginModal />
    </div>
  );
}

export default App;
