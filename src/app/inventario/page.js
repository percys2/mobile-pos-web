'use client';

import { useEffect, useState } from 'react';
import { supabase, ORG_ID, BRANCH_ID } from '@/lib/supabase';
import { CURRENCY } from '@/data/constants';
import { Package, AlertTriangle } from 'lucide-react';

export default function InventarioPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('current_stock')
        .select('*')
        .eq('org_id', ORG_ID)
        .eq('branch_id', BRANCH_ID)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error cargando inventario:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Inventario</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          Cargando inventario...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Inventario</h1>
        <div className="bg-red-50 rounded-xl shadow-sm p-8 text-center text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Inventario</h1>
      
      {products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          No hay productos en inventario
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-4 gap-4 p-4 bg-gray-50 font-medium text-gray-600 text-sm">
            <span>Producto</span>
            <span>SKU</span>
            <span className="text-center">Stock</span>
            <span className="text-right">Precio</span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {products.map((product) => {
              const stock = parseFloat(product.stock || 0);
              const minStock = parseFloat(product.min_stock || 0);
              const isLowStock = stock <= minStock && minStock > 0;
              const price = parseFloat(product.price || 0);
              
              return (
                <div 
                  key={product.product_id} 
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="sm:grid sm:grid-cols-4 sm:gap-4 sm:items-center">
                    <div className="flex items-center gap-2 mb-2 sm:mb-0">
                      <Package size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-800">{product.name}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-2 sm:mb-0">
                      <span className="sm:hidden font-medium">SKU: </span>
                      {product.sku || '-'}
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-center mb-2 sm:mb-0">
                      <span className="sm:hidden text-sm text-gray-500">Stock:</span>
                      <div className="flex items-center gap-1">
                        <span className={`font-semibold ${isLowStock ? 'text-orange-600' : 'text-gray-800'}`}>
                          {stock.toLocaleString('es-NI')}
                        </span>
                        {isLowStock && (
                          <AlertTriangle size={16} className="text-orange-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end">
                      <span className="sm:hidden text-sm text-gray-500">Precio:</span>
                      <span className="font-semibold text-emerald-700">
                        {CURRENCY} {price.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-emerald-50 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Total productos:</span>
          <span className="text-xl font-bold text-emerald-700">{products.length}</span>
        </div>
      </div>
    </div>
  );
}
