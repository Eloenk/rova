import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell() {
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar />
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
