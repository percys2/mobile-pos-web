'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, ORG_ID, BRANCH_ID } from '@/lib/supabase';
import { CURRENCY } from '@/data/constants';
import { X, Search, Plus, Minus } from 'lucide-react';

export default function POSPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const [clientsRes, productsRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, first_name, last_name, phone')
          .eq('org_id', ORG_ID)
          .order('first_name'),
                supabase
                  .from('current_stock')
                  .select('product_id, name, category, price, cost, stock')
                  .eq('org_id', ORG_ID)
                  .eq('branch_id', BRANCH_ID)
                  .gt('stock', 0)
                  .order('name')
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (productsRes.error) throw productsRes.error;

      setClients(clientsRes.data || []);
      setProducts(productsRes.data || []);

      const uniqueCategories = [...new Set((productsRes.data || []).map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error cargando datos:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    return fullName.includes(clientSearch.toLowerCase());
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectClient = (client) => {
    setSelectedClient(client);
    setClientName(`${client.first_name} ${client.last_name}`);
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const handleClientInputChange = (value) => {
    setClientName(value);
    setClientSearch(value);
    setSelectedClient(null);
    setShowClientDropdown(true);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => 
          item.product_id === product.product_id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
        } else {
          setCart([...cart, { 
            ...product, 
            quantity: 1,
            unit_price: product.price,
            unit_cost: product.cost || 0
          }]);
    }
    setShowProductModal(false);
    setProductSearch('');
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const total = subtotal - discount;

              const handleProformar = async () => {
          if (cart.length === 0) {
            alert('Agrega productos al carrito');
            return;
          }

          setSaving(true);
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            // Calculate margin from cart items (price - cost) * quantity
            const totalMargin = cart.reduce((sum, item) => {
              const itemMargin = (item.unit_price - (item.unit_cost || 0)) * item.quantity;
              return sum + itemMargin;
            }, 0);

                        // Get next sequential invoice number - same logic as ERP
                        let facturaNumber = null;
            
                        // First try the RPC function (atomic, prevents duplicates)
                        const { data: rpcResult, error: rpcError } = await supabase.rpc('get_next_invoice_number', {
                          p_org_id: ORG_ID,
                          p_branch_id: BRANCH_ID
                        });

                        if (!rpcError && rpcResult) {
                          facturaNumber = String(rpcResult);
                        } else {
                          // RPC failed, use fallback logic (same as ERP fallback)
                          console.warn('RPC failed, using fallback:', rpcError);
              
                          try {
                            // Try to get existing counter for this branch
                            const { data: counter, error: selectError } = await supabase
                              .from('invoice_counters')
                              .select('id, last_number')
                              .eq('org_id', ORG_ID)
                              .eq('branch_id', BRANCH_ID)
                              .maybeSingle();

                            if (selectError || !counter) {
                              // No counter exists, create one starting at 1
                              const { data: newCounter, error: insertError } = await supabase
                                .from('invoice_counters')
                                .insert({ 
                                  org_id: ORG_ID, 
                                  branch_id: BRANCH_ID, 
                                  last_number: 1,
                                  prefix: '',
                                  created_at: new Date().toISOString(),
                                  updated_at: new Date().toISOString()
                                })
                                .select('last_number')
                                .maybeSingle();

                              if (insertError || !newCounter) {
                                facturaNumber = '1';
                              } else {
                                facturaNumber = String(newCounter.last_number);
                              }
                            } else {
                              // Counter exists, increment it
                              const newNumber = (counter.last_number || 0) + 1;
                              facturaNumber = String(newNumber);
                  
                              await supabase
                                .from('invoice_counters')
                                .update({ 
                                  last_number: newNumber, 
                                  updated_at: new Date().toISOString() 
                                })
                                .eq('id', counter.id);
                            }
                          } catch (fallbackErr) {
                            console.warn('Fallback error:', fallbackErr);
                            facturaNumber = '1';
                          }
                        }

          const saleData = {
            org_id: ORG_ID,
            branch_id: BRANCH_ID,
            client_id: selectedClient?.id || null,
            client_name: clientName || 'Cliente General',
            user_id: userId,
            fecha: new Date().toISOString().split('T')[0],
            subtotal: subtotal,
            descuento: discount,
            iva: 0,
            total: total,
            margen: totalMargin,
            factura: facturaNumber,
            status: 'PAGADA',
            payment_method: 'EFECTIVO',
            amount_paid: total,
            created_at: new Date().toISOString()
          };

          const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert(saleData)
            .select()
            .single();

          if (saleError) throw saleError;

          const saleItems = cart.map(item => ({
            org_id: ORG_ID,
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.unit_price,
            cost: item.unit_cost || 0,
            subtotal: item.unit_price * item.quantity
          }));

          const { error: itemsError } = await supabase
            .from('sales_items')
            .insert(saleItems);

          if (itemsError) throw itemsError;

                    // Create kardex entries for each item (inventory out)
                    const kardexEntries = cart.map(item => ({
                      org_id: ORG_ID,
                      product_id: item.product_id,
                      branch_id: BRANCH_ID,
                      movement_type: 'SALE',
                      reference: `Factura #${facturaNumber}`,
                      quantity: -item.quantity, // Negative for sales
                      cost_unit: item.unit_cost || 0,
                      total: Math.abs((item.unit_cost || 0) * item.quantity),
                      created_by: userId,
                      from_branch: BRANCH_ID,
                      to_branch: null
                    }));

          const { error: kardexError } = await supabase
            .from('kardex')
            .insert(kardexEntries);

          if (kardexError) {
            console.warn('Error creando kardex:', kardexError);
          }

                    // Create inventory_movements entries for each item
                    const inventoryMovements = cart.map(item => ({
                      org_id: ORG_ID,
                      product_id: item.product_id,
                      type: 'salida',
                      qty: item.quantity,
                      from_branch: BRANCH_ID,
                      to_branch: null,
                      cost: item.unit_cost || 0,
                      price: item.unit_price,
                      reference: `Factura #${facturaNumber}`,
                      created_by: userId
                    }));

          const { error: movementsError } = await supabase
            .from('inventory_movements')
            .insert(inventoryMovements);

          if (movementsError) {
            console.warn('Error creando movimientos:', movementsError);
          }

          // Update current_stock for each item (decrease stock)
          for (const item of cart) {
            const { error: stockError } = await supabase
              .from('current_stock')
              .update({ stock: item.stock - item.quantity })
              .eq('product_id', item.product_id)
              .eq('branch_id', BRANCH_ID);

            if (stockError) {
              console.warn('Error actualizando stock:', stockError);
            }
          }

          alert(`Factura #${facturaNumber} registrada exitosamente`);
          setCart([]);
          setSelectedClient(null);
          setClientName('');
          setDiscount(0);
          router.push('/ventas');
        } catch (err) {
          console.error('Error creando venta:', err);
          alert('Error al crear venta: ' + err.message);
        } finally {
          setSaving(false);
        }
      };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-100">
      <div className="flex-1 p-4 pb-48">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <button
              onClick={() => setShowClientDropdown(!showClientDropdown)}
              className="bg-gray-300 text-gray-700 px-4 py-2 text-sm font-medium rounded"
            >
              BUSCAR CLIENTE
            </button>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={clientName}
              onChange={(e) => handleClientInputChange(e.target.value)}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="DESPACHO MASATEPE"
              className="w-full text-lg font-medium text-gray-700 bg-transparent border-b border-gray-300 py-1 px-2 focus:outline-none focus:border-emerald-600"
            />
            {showClientDropdown && clientSearch && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => selectClient(client)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{client.first_name} {client.last_name}</div>
                      {client.phone && <div className="text-sm text-gray-500">{client.phone}</div>}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    No se encontraron clientes. Se usara el nombre escrito.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowProductModal(true)}
          className="w-full bg-gray-300 text-gray-700 py-3 text-sm font-medium rounded mb-4"
        >
          AGREGAR PRODUCTO
        </button>

        <div className="flex flex-wrap gap-2 mb-4">
          {categories.slice(0, 6).map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setShowProductModal(true);
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 text-xs font-medium rounded flex-1 min-w-24 text-center"
            >
              {category.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-gray-500 text-sm font-medium border-b">
            <div className="col-span-5">Producto</div>
            <div className="col-span-2 text-center">Cant</div>
            <div className="col-span-2 text-right">P/U</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>
          
          {cart.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              No hay productos en el carrito
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.map(item => (
                <div key={item.product_id} className="grid grid-cols-12 gap-2 px-3 py-3 items-center">
                  <div className="col-span-5 text-sm font-medium text-gray-700 truncate">
                    {item.name}
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <button 
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-gray-600"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-gray-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="col-span-2 text-sm text-right text-gray-600">
                    {item.unit_price.toFixed(1)}
                  </div>
                  <div className="col-span-2 text-sm text-right font-medium text-gray-700">
                    {(item.unit_price * item.quantity).toFixed(1)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4">
        <div className="flex items-end gap-4">
          <button
            onClick={handleProformar}
            disabled={cart.length === 0 || saving}
            className="bg-emerald-700 text-white px-6 py-3 font-bold text-lg rounded disabled:bg-gray-400"
          >
            {saving ? 'GUARDANDO...' : 'FACTURAR'}
          </button>
          
          <div className="flex-1 text-right">
            <div className="flex justify-between text-gray-600 mb-1">
              <span>SubTotal:</span>
              <span className="font-semibold">{subtotal.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-gray-600 mb-1">
              <span>Descuento:</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 text-right border-b border-gray-300 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex justify-between text-emerald-600 text-xl font-bold">
              <span>Total:</span>
              <span>{total.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="flex-1 outline-none text-lg"
                autoFocus
              />
              <button onClick={() => {
                setShowProductModal(false);
                setProductSearch('');
                setSelectedCategory(null);
              }}>
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            
            {selectedCategory && (
              <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                <span className="text-sm text-gray-600">Categoria: {selectedCategory}</span>
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Ver todos
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron productos
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredProducts.map(product => (
                    <button
                      key={product.product_id}
                      onClick={() => addToCart(product)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-gray-800">{product.name}</div>
                        <div className="text-sm text-gray-500">Stock: {product.stock}</div>
                      </div>
                      <div className="text-emerald-700 font-semibold">
                        {CURRENCY} {product.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
