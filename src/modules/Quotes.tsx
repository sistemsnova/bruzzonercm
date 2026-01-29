
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquareText, Sparkles, Loader2, Search, Plus, X, Trash2,
  ShoppingCart, Users, DollarSign, Save, Share2, Info, Tag,
  LayoutGrid, AlertTriangle, RefreshCw, ChevronRight,
  ArrowUpRight, ImageIcon
} from 'lucide-react';
import { extractProductsFromText } from '../lib/geminiService';
import { useFirebase } from '../context/FirebaseContext';
import { Product, Client, ExtractedQuoteItem, QuoteItem } from '../types';

const ITEMS_PER_PAGE_PICKER = 10;

export const Quotes: React.FC = () => {
  const { clients, priceLists, fetchProductsPaginatedAndFiltered } = useFirebase();

  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
  const debounceTimeoutRefPicker = useRef<any>(null);

  // Helper to calculate product price based on client's price list and special discount
  const calculateProductPrice = useCallback((product: Product, client: Client | null): number => {
    let finalPrice = product.salePrice;

    if (!client || !product.costPrice) {
      return finalPrice || 0;
    }

    const clientPriceList = priceLists.find(pl => pl.id === client.priceListId);

    if (clientPriceList) {
      const baseCost = product.costPrice;
      if (clientPriceList.modifierType === 'margin') {
        finalPrice = baseCost * (1 + clientPriceList.value / 100);
      } else if (clientPriceList.modifierType === 'percentage_over_base') {
        finalPrice = (product.salePrice || 0) * (1 + clientPriceList.value / 100);
      }
    }

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
    setProvisionalQuote([]);

    try {
      const aiResponse = await extractProductsFromText(whatsappMessage);
      
      const newQuoteItems: QuoteItem[] = [];
      for (const item of aiResponse) {
        const { products: matchedProducts } = await fetchProductsPaginatedAndFiltered({
          limit: 1,
          searchTerm: item.productName.toLowerCase().trim(),
          orderByField: 'name',
          orderDirection: 'asc'
        });

        if (matchedProducts.length > 0) {
          const matchedProduct = matchedProducts[0];
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
          newQuoteItems.push({
            productId: `unmatched-${Date.now()}-${item.productName}`,
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
      setAiError('Ocurrió un error al procesar el mensaje con la IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    setProvisionalQuote(prevQuote =>
      prevQuote.map(item => ({
        ...item,
        unitPrice: item.originalProduct ? calculateProductPrice(item.originalProduct, selectedClient) : item.unitPrice,
        subtotal: item.originalProduct 
          ? parseFloat((calculateProductPrice(item.originalProduct, selectedClient) * item.quantity).toFixed(2))
          : item.subtotal
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
        orderByField: 'name',
        orderDirection: 'asc' as 'asc',
        startAfterDoc: isNewSearch ? undefined : currentLastVisibleDoc,
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
      loadPickerProducts(true, pickerSearchQuery, null);
    }
  }, [showProductPicker, loadPickerProducts, pickerSearchQuery]);

  const addProductFromPicker = (product: Product, unmatchedItemId?: string) => {
    if (unmatchedItemId) {
      setProvisionalQuote(prev => prev.map(item =>
        item.productId === unmatchedItemId
          ? {
              productId: product.id,
              sku: product.sku,
              name: product.name,
              brand: product.brand,
              quantity: item.quantity,
              unitPrice: calculateProductPrice(product, selectedClient),
              subtotal: parseFloat((calculateProductPrice(product, selectedClient) * item.quantity).toFixed(2)),
              originalProduct: product,
              unmatchedText: undefined,
            }
          : item
      ));
    } else {
      const existing = provisionalQuote.find(item => item.productId === product.id);
      if (existing) {
        setProvisionalQuote(prev => prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1, subtotal: parseFloat((item.unitPrice * (item.quantity + 1)).toFixed(2)) } : item
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
  };

  const subtotalValue = useMemo(() =>
    provisionalQuote.reduce((acc, item) => acc + item.subtotal, 0),
    [provisionalQuote]
  );

  const ivaValue = subtotalValue * 0.21;
  const totalValue = subtotalValue + ivaValue;

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
        <button
          onClick={() => { setWhatsappMessage(''); setProvisionalQuote([]); setSelectedClient(null); setAiError(null); }}
          className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Limpiar
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              {isAnalyzing ? 'Analizando...' : 'Analizar Mensaje'}
            </button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
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
            </div>

            <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Artículo</th>
                    <th className="px-6 py-3 text-center">Cant.</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                    <th className="px-6 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {provisionalQuote.map((item) => (
                    <tr key={item.productId} className="text-sm hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {item.originalProduct ? (
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{item.sku}</p>
                          </div>
                        ) : (
                          <div className="text-red-600 font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {item.name}
                            <button onClick={() => { setShowProductPicker(true); }} className="ml-2 px-2 py-1 bg-red-50 text-[10px] rounded">Buscar</button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuoteItemQuantityChange(item.productId, Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-md text-center font-bold"
                          min="1"
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-black">${item.subtotal.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleRemoveQuoteItem(item.productId)} className="text-slate-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={() => setShowProductPicker(true)} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Añadir Manualmente
            </button>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-2 shadow-xl">
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Subtotal</span>
                <span>${subtotalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <span className="text-xl font-black uppercase tracking-tight">TOTAL</span>
                <span className="text-4xl font-black text-orange-500">${totalValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button disabled={provisionalQuote.length === 0} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                <Save className="w-5 h-5" /> Guardar
              </button>
              <button disabled={provisionalQuote.length === 0 || !selectedClient?.whatsapp} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                <Share2 className="w-5 h-5" /> WhatsApp
              </button>
            </div>
          </section>
        </div>
      </div>

      {showProductPicker && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase">Buscar Producto</h2>
              <button onClick={() => setShowProductPicker(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="SKU, nombre o marca..."
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-slate-50/50"
                  value={pickerSearchQuery}
                  onChange={(e) => { setPickerSearchQuery(e.target.value); debouncedPickerSearch(e.target.value); }}
                />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {isPickerProductsLoading ? (
                  <div className="text-center py-10"><Loader2 className="w-10 h-10 text-slate-200 mx-auto animate-spin" /></div>
                ) : (
                  pickerProducts.map(item => (
                    <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-orange-200 cursor-pointer" onClick={() => addProductFromPicker(item)}>
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{item.sku}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-black text-slate-900">${item.salePrice?.toLocaleString()}</p>
                        <Plus className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
