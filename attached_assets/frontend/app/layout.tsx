
import './globals.css';
import TopNav from '@/components/TopNav';
export const metadata = { title: 'Storm Disaster', description: 'Contractors + homeowners + admin portal' };
export default function RootLayout({ children }: { children: React.ReactNode }){
  return (<html lang="en"><body className="min-h-screen bg-white text-black"><TopNav /><main>{children}</main></body></html>);
}
