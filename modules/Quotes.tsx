
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquareText, Sparkles, Loader2, Search, Plus, X, Trash2,
  ShoppingCart, Users, DollarSign, Save, Share2, Printer, Info, Tag,
  LayoutGrid, AlertTriangle, ExternalLink, RefreshCw, ChevronRight,
  ArrowUpRight, ImageIcon // Added missing imports
} from 'lucide-react';
import { extractProductsFromText } from '../geminiService';
import { useFirebase } from '../context/FirebaseContext';
import { Product, Client, PriceList, ExtractedQuoteItem, QuoteItem } from '../types';

const ITEMS_PER_PAGE_PICKER = 10; // Number of items to load in the product picker

const Quotes: React.FC = () => {
  const { clients, priceLists, fetchProductsPaginatedAndFiltered } = useFirebase();

  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedQuoteItem[]>([]);
  const [provisionalQuote, setProvisionalQuote] = useState<QuoteItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // States for manual product search (picker)
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
  const [pickerLastVisibleDoc, setPickerLastVisibleDoc] = useState<any>(null);
  const [hasMorePickerProducts, setHasMorePickerProducts] = useState(true);
  const [isPickerProductsLoading, setIsPickerProductsLoading] = useState(false);
  const debounceTimeoutRefPicker = useRef<any>();

  // Helper to calculate product price based on client's price list and special discount
  const calculateProductPrice = useCallback((product: Product, client: Client | null): number => {
    let finalPrice = product.salePrice;

    if (!client || !product.costPrice) {
      return finalPrice || 0;
    }

    const clientPriceList = priceLists.find(pl => pl.id === client.priceListId);

    if (clientPriceList) {
      const baseCost = product.costPrice; // Assuming product.costPrice is the base for calculations

      if (clientPriceList.modifierType === 'margin') {
        finalPrice = baseCost * (1 + clientPriceList.value / 100);
      } else if (clientPriceList.modifierType === 'percentage_over_base') {
        // This implies the base list is used. If this list *is* the base, it's just its value.
        // Otherwise, it's a percentage *over* the base list's calculated price.
        // For simplicity, let's apply over product.salePrice if no explicit "base price" exists in product.
        // A more robust system would calculate the 'base list price' first.
        finalPrice = (product.salePrice || 0) * (1 + clientPriceList.value / 100);
      }
    }

    // Apply client's special discount
    if (client.specialDiscount > 0) {
      finalPrice = finalPrice * (1 - client.specialDiscount / 100);
    }

    return parseFloat(finalPrice.toFixed(2));
  }, [priceLists]);

  const handleAnalyzeMessage = async () => {
    if (!whatsappMessage.trim()) {
      setAiError('Por favor, ingresa un mensaje para analizar.');
      return;
    }
    setIsAnalyzing(true);
    setAiError(null);
    setExtractedItems([]);
    setProvisionalQuote([]);

    try {
      const aiResponse = await extractProductsFromText(whatsappMessage);
      setExtractedItems(aiResponse);
      
      const newQuoteItems: QuoteItem[] = [];
      for (const item of aiResponse) {
        // Search for product in Firebase
        const { products: matchedProducts } = await fetchProductsPaginatedAndFiltered({
          limit: 1, // Get the most relevant match
          searchTerm: item.productName.toLowerCase().trim(),
          orderByField: 'name',
          orderDirection: 'asc'
        });

        if (matchedProducts.length > 0) {
          const matchedProduct = matchedProducts[0];
          // Fixed: Calculate subtotal for found product
          const unitPrice = calculateProductPrice(matchedProduct, selectedClient);
          newQuoteItems.push({
            productId: matchedProduct.id,
            sku: matchedProduct.sku,
            name: matchedProduct.name,
            brand: matchedProduct.brand,
            quantity: item.quantity,
            unitPrice: unitPrice, 
            subtotal: parseFloat((unitPrice * item.quantity).toFixed(2)),
            originalProduct: matchedProduct,
          });
        } else {
          // If no match, add as an unmatched item
          // Fixed: Added missing subtotal and unmatchedText correctly handled via type definition update
          newQuoteItems.push({
            productId: `unmatched-${Date.now()}-${item.productName}`, // Unique ID for unmatched
            sku: 'N/A',
            name: item.productName,
            brand: 'N/A',
            quantity: item.quantity,
            unitPrice: 0, 
            subtotal: 0,
            originalProduct: null, 
            unmatchedText: item.productName,
          });
        }
      }
      setProvisionalQuote(newQuoteItems);

    } catch (error) {
      console.error("Error al analizar el mensaje:", error);
      setAiError('Ocurrió un error al procesar el mensaje con la IA. Intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Recalculate prices when selectedClient changes
  useEffect(() => {
    setProvisionalQuote(prevQuote =>
      prevQuote.map(item => ({
        ...item,
        unitPrice: item.originalProduct ? calculateProductPrice(item.originalProduct, selectedClient) : item.unitPrice
      }))
    );
  }, [selectedClient, calculateProductPrice]);

  const handleQuoteItemQuantityChange = (productId: string, newQuantity: number) => {
    setProvisionalQuote(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity, subtotal: parseFloat((item.unitPrice * newQuantity).toFixed(2)) } : item
      )
    );
  };

  const handleRemoveQuoteItem = (productId: string) => {
    setProvisionalQuote(prev => prev.filter(item => item.productId !== productId));
  };

  // Product Picker Logic
  const loadPickerProducts = useCallback(async (
    isNewSearch: boolean = false,
    searchTerm: string = pickerSearchQuery,
    currentLastVisibleDoc: any = pickerLastVisibleDoc
  ) => {
    setIsPickerProductsLoading(true);
    try {
      const options = {
        limit: ITEMS_PER_PAGE_PICKER,
        searchTerm: searchTerm.toLowerCase().trim(),
        startAfterDoc: isNewSearch ? undefined : currentLastVisibleDoc,
        orderByField: 'name',
        orderDirection: 'asc' as 'asc'
      };

      const { products: fetchedProducts, lastVisible, hasMore } = await fetchProductsPaginatedAndFiltered(options);

      setPickerProducts(prev => isNewSearch ? fetchedProducts : [...prev, ...fetchedProducts]);
      setPickerLastVisibleDoc(lastVisible);
      setHasMorePickerProducts(hasMore);
    } catch (err) {
      console.error("Error loading products for picker:", err);
    } finally {
      setIsPickerProductsLoading(false);
    }
  }, [pickerSearchQuery, pickerLastVisibleDoc, fetchProductsPaginatedAndFiltered]);

  const debouncedPickerSearch = useCallback((value: string) => {
    if (debounceTimeoutRefPicker.current) {
      clearTimeout(debounceTimeoutRefPicker.current);
    }
    debounceTimeoutRefPicker.current = setTimeout(() => {
      loadPickerProducts(true, value, null);
    }, 300);
  }, [loadPickerProducts]);

  useEffect(() => {
    if (showProductPicker) {
      setPickerProducts([]);
      setPickerLastVisibleDoc(null);
      setHasMorePickerProducts(true);
      loadPickerProducts(true, pickerSearchQuery, null);
    }
  }, [pickerSearchQuery, showProductPicker, loadPickerProducts]);


  const addProductFromPicker = (product: Product, unmatchedItemId?: string) => {
    // If it's replacing an unmatched item
    if (unmatchedItemId) {
      setProvisionalQuote(prev => prev.map(item =>
        item.productId === unmatchedItemId
          ? {
              productId: product.id,
              sku: product.sku,
              name: product.name,
              brand: product.brand,
              quantity: item.quantity, // Keep original quantity
              unitPrice: calculateProductPrice(product, selectedClient),
              subtotal: parseFloat((calculateProductPrice(product, selectedClient) * item.quantity).toFixed(2)),
              originalProduct: product,
              unmatchedText: undefined,
            }
          : item
      ));
    } else {
      // Add as a new item
      const existing = provisionalQuote.find(item => item.productId === product.id);
      if (existing) {
        setProvisionalQuote(prev => prev.map(item =>
          item.productId === product.id ? { ...item, quantity: Number(item.quantity) + 1, subtotal: parseFloat((item.unitPrice * (Number(item.quantity) + 1)).toFixed(2)) } : item
        ));
      } else {
        const unitPrice = calculateProductPrice(product, selectedClient);
        setProvisionalQuote(prev => [
          ...prev,
          {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            brand: product.brand,
            quantity: 1,
            unitPrice: unitPrice,
            subtotal: parseFloat(unitPrice.toFixed(2)),
            originalProduct: product,
          },
        ]);
      }
    }
    setShowProductPicker(false);
    setPickerSearchQuery('');
  };

  const subtotal = useMemo(() =>
    provisionalQuote.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [provisionalQuote]
  );

  const iva = subtotal * 0.21; // Assuming 21% IVA
  const total = subtotal + iva;

  const handleClearQuote = () => {
    setWhatsappMessage('');
    setExtractedItems([]);
    setProvisionalQuote([]);
    setSelectedClient(null);
    setAiError(null);
  };

  const handleSaveQuote = () => {
    if (!selectedClient) {
      alert('Por favor, selecciona un cliente para guardar la cotización.');
      return;
    }
    if (provisionalQuote.length === 0) {
      alert('La cotización está vacía.');
      return;
    }
    
    console.log("Saving Quote for client:", selectedClient.name, "Items:", provisionalQuote, "Total:", total);
    alert('Cotización guardada (simulada) para ' + selectedClient.name);
    // In a real app: addDoc(collection(db, "quotes"), { clientId: selectedClient.id, items: provisionalQuote, total: total, date: serverTimestamp(), status: 'pending' });
  };

  const handleSendWhatsApp = () => {
    if (!selectedClient || !selectedClient.whatsapp) {
      alert('Por favor, selecciona un cliente con número de WhatsApp para enviar la cotización.');
      return;
    }
    if (provisionalQuote.length === 0) {
      alert('La cotización está vacía.');
      return;
    }

    let message = `¡Hola ${selectedClient.name}! Aquí tienes tu cotización de FerroGest:\n\n`;
    provisionalQuote.forEach(item => {
      message += `- ${item.quantity}x ${item.name} ($${item.unitPrice.toLocaleString()}/u) - Subtotal: $${(item.quantity * item.unitPrice).toLocaleString()}\n`;
    });
    message += `\nSubtotal: $${subtotal.toLocaleString()}`;
    message += `\nIVA (21%): $${iva.toLocaleString()}`;
    message += `\nTotal: *$${total.toLocaleString()}*\n\n`;
    message += `¡Esperamos tu confirmación!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${selectedClient.whatsapp}?text=${encodedMessage}`, '_blank');
  };

  const renderProductPickerModal = (unmatchedItemId?: string) => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Plus className="w-6 h-6" /></div><div><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{unmatchedItemId ? 'Reemplazar Producto' : 'Añadir Producto Manual'}</h2><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Busca productos en tu inventario</p></div></div>
          <button onClick={() => setShowProductPicker(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Busca por SKU, nombre o marca..."
              className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-slate-50/50 shadow-sm"
              value={pickerSearchQuery}
              onChange={(e) => {
                setPickerSearchQuery(e.target.value);
                debouncedPickerSearch(e.target.value);
              }}
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {isPickerProductsLoading && pickerSearchQuery.length > 1 ? (
              <div className="text-center py-10">
                <Loader2 className="w-10 h-10 text-slate-200 mx-auto mb-2 animate-spin" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Buscando productos...</p>
              </div>
            ) : pickerProducts.length > 0 ? (
              pickerProducts.map(item => (
                <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group" onClick={() => addProductFromPicker(item, unmatchedItemId)}>
                  <div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-500 transition-colors"><Tag className="w-5 h-5" /></div><div><p className="font-bold text-slate-800 text-sm">{item.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.sku} • {item.brand}</p></div></div>
                  <div className="flex items-center gap-4 text-right"><div><p className="text-sm font-black text-slate-900">${item.salePrice?.toLocaleString()}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stock: {item.stock}</p></div><div className="p-2 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm"><Plus className="w-5 h-5" /></div></div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Info className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Escribe para buscar productos del catálogo</p>
              </div>
            )}
          </div>

          {!isPickerProductsLoading && hasMorePickerProducts && (
            <div className="p-4 border-t border-slate-100 flex justify-center">
              <button
                onClick={() => loadPickerProducts(false, pickerSearchQuery, pickerLastVisibleDoc)}
                className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
              >
                Cargar Más
                <ArrowUpRight className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          )}
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4"><div className="flex items-center gap-3 text-slate-400 flex-1"><ImageIcon className="w-5 h-5" /><p className="text-[10px] font-bold leading-tight">Al vincular, se tomarán los datos de stock y precio automáticamente.</p></div><button onClick={() => setShowProductPicker(false)} className="py-4 px-8 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Cerrar</button></div>
      </div>
    </div>
  );


  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-[1.5rem] shadow-xl"><MessageSquareText className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cotizaciones Rápidas con IA</h1>
            <p className="text-slate-500 text-sm">Convierte mensajes de WhatsApp en presupuestos profesionales al instante.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearQuote}
            className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Limpiar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Input de WhatsApp y Análisis */}
        <div className="space-y-6">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <MessageSquareText className="w-6 h-6 text-blue-600" /> Mensaje de WhatsApp
            </h3>
            <textarea
              className="w-full h-64 px-6 py-4 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 resize-none custom-scrollbar"
              placeholder="Pega aquí el mensaje del cliente (productos, cantidades, etc.)..."
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
            ></textarea>
            {aiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">{aiError}</span>
              </div>
            )}
            <button
              onClick={handleAnalyzeMessage}
              disabled={isAnalyzing || !whatsappMessage.trim()}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              {isAnalyzing ? 'Analizando Mensaje...' : 'Analizar Mensaje con IA'}
            </button>
            <p className="text-[10px] font-bold text-slate-400 italic text-center">La IA intentará extraer productos y cantidades.</p>
          </section>
        </div>

        {/* Columna Derecha: Cotización Provisional */}
        <div className="space-y-6">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-orange-600" /> Cotización Provisional
            </h3>

            {/* Client Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Seleccionar Cliente
              </label>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
              >
                <option value="">Cliente Ocasional</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name} ({client.cuit})</option>
                ))}
              </select>
              {selectedClient && (
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                  <LayoutGrid className="w-4 h-4 text-orange-400" />
                  <span>Lista: {priceLists.find(pl => pl.id === selectedClient.priceListId)?.name || 'N/A'}</span>
                  {selectedClient.specialDiscount > 0 && <span className="ml-2"> | Desc. Esp.: {selectedClient.specialDiscount}%</span>}
                </div>
              )}
            </div>

            {/* Product List */}
            <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Artículo</th>
                    <th className="px-6 py-3 text-center">Cant.</th>
                    <th className="px-6 py-3 text-right">Precio Unit.</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                    <th className="px-6 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {provisionalQuote.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                        No hay productos en la cotización.
                      </td>
                    </tr>
                  ) : (
                    provisionalQuote.map((item, idx) => (
                      <tr key={item.productId || idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          {item.originalProduct ? (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{item.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase">{item.sku} • Stock: {item.originalProduct.stock}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-600 font-bold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> {item.unmatchedText || item.name} (No encontrado)
                              <button
                                onClick={() => setShowProductPicker(true)} // Open picker for manual match
                                className="ml-2 px-3 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold hover:bg-red-100 transition-colors"
                                title="Buscar y reemplazar"
                              >
                                Buscar
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuoteItemQuantityChange(item.productId, Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-slate-200 rounded-md text-center font-bold"
                            min="1"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right font-black">${(item.quantity * item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRemoveQuoteItem(item.productId)}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowProductPicker(true)}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Añadir Producto Manualmente
            </button>

            {/* Totals Summary */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>IVA (21%)</span>
                <span>${iva.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <span className="text-xl font-black uppercase tracking-tight">TOTAL FINAL</span>
                <span className="text-4xl font-black text-orange-500">${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                onClick={handleSaveQuote}
                disabled={provisionalQuote.length === 0}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" /> Guardar Cotización
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={provisionalQuote.length === 0 || !selectedClient?.whatsapp}
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-600/20 hover:bg-green-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="w-5 h-5" /> Enviar por WhatsApp
              </button>
            </div>
          </section>
        </div>
      </div>

      {showProductPicker && renderProductPickerModal()}
    </div>
  );
};

export default Quotes;
