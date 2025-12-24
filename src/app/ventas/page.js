'use client';

import { useEffect, useState } from 'react';
import { supabase, ORG_ID, BRANCH_ID } from '@/lib/supabase';
import { CURRENCY } from '@/data/constants';
import StatusBadge from '@/components/StatusBadge';

export default function VentasPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('org_id', ORG_ID)
        .eq('branch_id', BRANCH_ID)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error cargando ventas:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const totalDia = sales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Ventas</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          Cargando ventas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Ventas</h1>
        <div className="bg-red-50 rounded-xl shadow-sm p-8 text-center text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Ventas</h1>
      
      {sales.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          No hay ventas registradas
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {sales.map((sale) => (
              <div 
                key={sale.id} 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-semibold text-gray-800">
                                            {sale.factura ? `Factura #${sale.factura}` : 'Sin Factura'}
                                          </span>
                                          {sale.status && <StatusBadge status={sale.status} />}
                                        </div>
                    <p className="text-sm text-gray-500">{sale.client_name || 'Cliente General'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {sale.fecha ? new Date(sale.fecha).toLocaleDateString('es-NI', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-700">
                      {CURRENCY} {parseFloat(sale.total || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-emerald-50 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Total ({sales.length} ventas):</span>
          <span className="text-xl font-bold text-emerald-700">
            {CURRENCY} {totalDia.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
