'use client';

import { useEffect, useState } from 'react';
import { supabase, ORG_ID } from '@/lib/supabase';
import { CURRENCY } from '@/data/constants';
import { Phone, User, MapPin } from 'lucide-react';

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('org_id', ORG_ID)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error cargando clientes:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Clientes</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          Cargando clientes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Clientes</h1>
        <div className="bg-red-50 rounded-xl shadow-sm p-8 text-center text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Clientes</h1>
      
      {clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          No hay clientes registrados
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clients.map((client) => (
            <div 
              key={client.id} 
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {client.first_name} {client.last_name}
                  </h3>
                  {client.phone && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Phone size={14} />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {(client.city || client.municipio) && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={14} />
                      <span className="truncate">{client.city || client.municipio}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {client.total_purchases > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total compras:</span>
                    <span className="font-semibold text-emerald-600">
                      {CURRENCY} {parseFloat(client.total_purchases).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 p-4 bg-white rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Total clientes:</span>
          <span className="text-xl font-bold text-emerald-700">{clients.length}</span>
        </div>
      </div>
    </div>
  );
}
