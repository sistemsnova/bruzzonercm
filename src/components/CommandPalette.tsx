import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, Loader2, ArrowRight, CornerDownLeft } from 'lucide-react';
import { interpretCommand } from '../lib/geminiService';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, target: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onAction }) => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Tipamos la respuesta para que TypeScript no se queje
      const result = await interpretCommand(query) as { action: string; target?: string; message: string };
      
      if (result.action && result.action !== 'ERROR') {
        // Aseguramos que target sea un string, aunque venga vacío
        onAction(result.action, result.target || '');
        onClose();
      } else {
        alert(result.message || 'No se pudo procesar el comando');
      }
    } catch (err) {
      console.error('Error en CommandPalette:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="relative">
          <div className="p-6 flex items-center gap-4">
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            ) : (
              <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué necesitas hacer hoy? (Ej: Ver stock bajo, Cobrar a Juan...)"
              className="flex-1 bg-transparent border-none outline-none text-xl font-medium text-slate-800 placeholder:text-slate-300"
            />
            <div className="flex items-center gap-2">
              <span className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-tighter border border-slate-200">
                <CornerDownLeft className="w-3 h-3" /> Enter
              </span>
              <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
            <div className="flex gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div> Sugerencias AI
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-300 italic">Interpreta lenguaje natural con Google Gemini</p>
          </div>
        </form>

        {query.length > 0 && !isProcessing && (
          <div className="p-4 bg-white animate-in slide-in-from-top-2 border-t border-slate-50">
            <div className="p-4 hover:bg-orange-50 rounded-2xl cursor-pointer flex items-center justify-between group transition-all" onClick={handleSubmit}>
              <div className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                <span className="text-sm font-bold text-slate-600">Ejecutar comando: <span className="text-slate-900">"{query}"</span></span>
              </div>
              <Sparkles className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandPalette;