'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, ORG_ID, BRANCH_ID } from '@/lib/supabase';
import { DENOMINATIONS, CURRENCY, TRANSFER_BANKS } from '@/data/constants';
import BillInput from '@/components/BillInput';
import { Building2 } from 'lucide-react';

export default function CotejoCajaPage() {
  const router = useRouter();
  const [bills, setBills] = useState({});
  const [transfers, setTransfers] = useState({});
  const [systemTotal, setSystemTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemTotal();
  }, []);

  async function loadSystemTotal() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('sales')
        .select('total')
        .eq('org_id', ORG_ID)
        .eq('branch_id', BRANCH_ID)
        .gte('fecha', today);

      if (error) throw error;
      
      const total = (data || []).reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
      setSystemTotal(total);
    } catch (err) {
      console.error('Error cargando total del sistema:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const cashTotal = DENOMINATIONS.reduce(
    (sum, d) => sum + d * (bills[d] || 0),
    0
  );

  const transfersTotal = TRANSFER_BANKS.reduce(
    (sum, bank) => sum + (parseFloat(transfers[bank]) || 0),
    0
  );

  const countedTotal = cashTotal + transfersTotal;
  const difference = countedTotal - systemTotal;

  const updateBill = (denomination, quantity) => {
    setBills((prev) => ({ ...prev, [denomination]: quantity }));
  };

  const updateTransfer = (bank, amount) => {
    setTransfers((prev) => ({ ...prev, [bank]: amount }));
  };

  const goToClose = () => {
    const movementsData = {
      bills: { ...bills },
      transfers: { ...transfers },
      totals: {
        cash: cashTotal,
        transfers: transfersTotal,
        total: countedTotal
      }
    };

    const params = new URLSearchParams({
      systemTotal: systemTotal.toString(),
      countedTotal: countedTotal.toString(),
      difference: difference.toString(),
      movements: JSON.stringify(movementsData),
    });
    router.push(`/cerrar-caja?${params.toString()}`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Cotejo de Caja</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="text-gray-600">Total sistema (hoy):</span>
          <span className="text-xl font-bold text-emerald-700">
            {loading ? 'Cargando...' : `${CURRENCY} ${systemTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`}
          </span>
        </div>
        
        <div className="py-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Conteo de Billetes y Monedas</h2>
          {DENOMINATIONS.map((denomination) => (
            <BillInput
              key={denomination}
              denomination={denomination}
              value={bills[denomination] || 0}
              onChange={(value) => updateBill(denomination, value)}
            />
          ))}
          
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Subtotal efectivo:</span>
              <span className="font-semibold text-gray-700">
                {CURRENCY} {cashTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-gray-500" />
          Transferencias Bancarias
        </h2>
        
        {TRANSFER_BANKS.map((bank) => (
          <div key={bank} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <span className="text-base font-medium text-gray-700">{bank}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{CURRENCY}</span>
              <input
                type="number"
                value={transfers[bank] || ''}
                onChange={(e) => updateTransfer(bank, e.target.value)}
                placeholder="0.00"
                className="w-28 text-right border border-gray-300 rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}
        
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Subtotal transferencias:</span>
            <span className="font-semibold text-gray-700">
              {CURRENCY} {transfersTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total contado:</span>
            <span className="text-xl font-bold text-gray-800">
              {CURRENCY} {countedTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-gray-600 font-medium">Diferencia:</span>
            <span className={`text-xl font-bold ${difference === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {CURRENCY} {difference.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
      
      <button
        onClick={goToClose}
        disabled={loading}
        className="w-full bg-emerald-700 text-white py-3 px-4 rounded-xl font-semibold hover:bg-emerald-800 active:bg-emerald-900 transition-colors shadow-sm disabled:bg-gray-400"
      >
        Continuar a Cierre
      </button>
    </div>
  );
}
