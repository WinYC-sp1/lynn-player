import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';
import TitleBar from './TitleBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <div className="app-layout__titlebar">
        <TitleBar />
      </div>
      <Sidebar />
      <main className="app-layout__content">{children}</main>
      <PlayerBar />
    </div>
  );
}
