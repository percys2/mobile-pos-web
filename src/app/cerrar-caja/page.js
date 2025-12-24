'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, ORG_ID, BRANCH_ID } from '@/lib/supabase';
import { CURRENCY } from '@/data/constants';
import { AlertTriangle, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function CashCloseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const systemTotal = parseFloat(searchParams.get('systemTotal') || '0');
  const countedTotal = parseFloat(searchParams.get('countedTotal') || '0');
  const difference = parseFloat(searchParams.get('difference') || '0');
  const movementsParam = searchParams.get('movements');
  const movements = movementsParam ? JSON.parse(decodeURIComponent(movementsParam)) : null;

  const canClose = difference === 0;

  const handleClose = async () => {
    if (!canClose) return;
    
    setSaving(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const userEmail = session?.user?.email || 'Usuario';

      if (!userId) {
        throw new Error('Debes iniciar sesion para cerrar caja');
      }

      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];

      const { data: salesData } = await supabase
        .from('sales')
        .select('created_at')
        .eq('org_id', ORG_ID)
        .eq('branch_id', BRANCH_ID)
        .eq('fecha', today)
        .order('created_at', { ascending: true })
        .limit(1);

            const openingTime = salesData && salesData.length > 0 
              ? salesData[0].created_at 
              : new Date(today + 'T07:00:00').toISOString();

      const { data: salesCount } = await supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', ORG_ID)
        .eq('branch_id', BRANCH_ID)
        .eq('fecha', today);

      const { error: insertError } = await supabase
        .from('cash_register_closings')
        .insert({
          org_id: ORG_ID,
          branch_id: BRANCH_ID,
          user_id: userId,
          user_name: userEmail,
          opening_time: openingTime,
          closing_time: now,
          opening_amount: 0,
          total_entries: systemTotal,
          total_exits: 0,
          expected_total: systemTotal,
          counted_amount: countedTotal,
          difference: difference,
          sales_count: salesCount?.count || 0,
          movements_count: 0,
          movements: movements,
          created_at: now,
        });

      if (insertError) throw insertError;

            setSuccess(true);
      
            // Store closure time in localStorage to block access until 7 AM next day
            const closureDate = new Date();
            const nextOpenTime = new Date(closureDate);
            nextOpenTime.setDate(nextOpenTime.getDate() + 1);
            nextOpenTime.setHours(7, 0, 0, 0);
            localStorage.setItem('cashClosureTime', closureDate.toISOString());
            localStorage.setItem('nextOpenTime', nextOpenTime.toISOString());
      
            // Logout user after 2 seconds
            setTimeout(async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }, 2000);
    } catch (err) {
      console.error('Error guardando cierre:', err);
      setError(err.message || 'Error al guardar el cierre de caja');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Caja Cerrada</h1>
          <p className="text-gray-600">El cierre de caja se ha guardado exitosamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Cierre de Caja</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${canClose ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {canClose ? (
              <CheckCircle size={32} className="text-emerald-600" />
            ) : (
              <AlertTriangle size={32} className="text-red-600" />
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Total sistema:</span>
            <span className="text-lg font-semibold text-gray-800">
              {CURRENCY} {systemTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Total contado:</span>
            <span className="text-lg font-semibold text-gray-800">
              {CURRENCY} {countedTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600 font-medium">Diferencia:</span>
            <span className={`text-xl font-bold ${canClose ? 'text-emerald-600' : 'text-red-600'}`}>
              {CURRENCY} {difference.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {!canClose && !error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">
                No puedes cerrar caja con diferencia. Por favor, verifica el conteo de efectivo.
              </p>
            </div>
          </div>
        )}
        
        {canClose && !error && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-2">
              <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-700 text-sm">
                El conteo coincide con el sistema. Puedes proceder a cerrar la caja.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={handleClose}
        disabled={!canClose || saving}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors shadow-sm flex items-center justify-center gap-2
          ${canClose && !saving
            ? 'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
      >
        {saving ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Lock size={20} />
            Confirmar Cierre
          </>
        )}
      </button>
    </div>
  );
}

export default function CerrarCajaPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto p-4">Cargando...</div>}>
      <CashCloseContent />
    </Suspense>
  );
}
