import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {/* Add bottom padding on mobile to account for bottom nav */}
          <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
