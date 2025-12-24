'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AppLayout from './AppLayout';
import { Lock } from 'lucide-react';

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Check if system is locked due to cash closure
function isSystemLocked() {
  if (typeof window === 'undefined') return { locked: false };
  
  const nextOpenTimeStr = localStorage.getItem('nextOpenTime');
  if (!nextOpenTimeStr) return { locked: false };
  
  const nextOpenTime = new Date(nextOpenTimeStr);
  const now = new Date();
  
  if (now < nextOpenTime) {
    return { 
      locked: true, 
      nextOpenTime: nextOpenTime 
    };
  } else {
    // Time has passed, clear the lock
    localStorage.removeItem('cashClosureTime');
    localStorage.removeItem('nextOpenTime');
    return { locked: false };
  }
}

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [systemLocked, setSystemLocked] = useState(false);
  const [nextOpenTime, setNextOpenTime] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if system is locked due to cash closure
        const lockStatus = isSystemLocked();
        if (lockStatus.locked) {
          setSystemLocked(true);
          setNextOpenTime(lockStatus.nextOpenTime);
          setLoading(false);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error.message);
          await supabase.auth.signOut();
          setAuthenticated(false);
          if (!publicRoutes.includes(pathname)) {
            router.push('/login');
          }
        } else if (session) {
          setAuthenticated(true);
          if (publicRoutes.includes(pathname)) {
            router.push('/ventas');
          }
        } else {
          setAuthenticated(false);
          if (!publicRoutes.includes(pathname)) {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
        setAuthenticated(false);
        if (!publicRoutes.includes(pathname)) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setAuthenticated(true);
          if (publicRoutes.includes(pathname)) {
            router.push('/ventas');
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthenticated(false);
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show locked screen if system is locked due to cash closure
  if (systemLocked) {
    const formatTime = (date) => {
      return date.toLocaleTimeString('es-NI', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };
    const formatDate = (date) => {
      return date.toLocaleDateString('es-NI', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long'
      });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Caja Cerrada</h1>
          <p className="text-gray-400 mb-6">
            El sistema esta bloqueado hasta las 7:00 AM del dia siguiente.
          </p>
          {nextOpenTime && (
            <div className="bg-gray-800 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-sm mb-1">Podras acceder:</p>
              <p className="text-emerald-400 text-xl font-bold">
                {formatDate(nextOpenTime)}
              </p>
              <p className="text-emerald-400 text-lg">
                {formatTime(nextOpenTime)}
              </p>
            </div>
          )}
          <p className="text-gray-500 text-sm">
            Si necesitas acceso de emergencia, contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  if (publicRoutes.includes(pathname)) {
    return children;
  }

  if (!authenticated) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
