'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Calculator, 
  Lock, 
  Menu, 
  X,
  LogOut,
  PlusCircle
} from 'lucide-react';

const navItems = [
  { href: '/pos', label: 'Nuevo Pedido', icon: PlusCircle },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/cotejo-caja', label: 'Cotejo de Caja', icon: Calculator },
  { href: '/cerrar-caja', label: 'Cerrar Caja', icon: Lock },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-emerald-700 flex items-center justify-between px-4 z-50 shadow-md">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 text-white hover:bg-emerald-600 rounded-lg transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-white text-lg font-semibold ml-2 md:ml-0">
            Mobile POS
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-white hover:bg-emerald-600 rounded-lg transition-colors md:hidden"
          aria-label="Cerrar sesion"
        >
          <LogOut size={20} />
        </button>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >
        <nav className="py-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/ventas');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-emerald-700' : 'text-gray-500'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
