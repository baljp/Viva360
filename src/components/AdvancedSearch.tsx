import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, ChevronLeft, Star, SlidersHorizontal, MapPin, DollarSign, Sparkles, ChevronDown, Check } from 'lucide-react';
import { User, Professional, Product } from '../types';
import { DynamicAvatar, Card } from './Common';
import { api } from '../services/api';

interface SearchFilters {
  specialty?: string;
  minRating?: number;
  maxPrice?: number;
  city?: string;
  category?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FilterOption {
  label: string;
  value: string | number;
}

interface AdvancedSearchProps {
  searchType: 'professionals' | 'products';
  onClose: () => void;
  onSelectProfessional?: (pro: Professional) => void;
  onSelectProduct?: (product: Product) => void;
}

export const AdvancedSearchScreen: React.FC<AdvancedSearchProps> = ({
  searchType,
  onClose,
  onSelectProfessional,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filter options
  const specialties = [
    'Yoga', 'Meditação', 'Terapia Holística', 'Reiki', 'Massagem',
    'Astrologia', 'Tarot', 'Mindfulness', 'Psicologia', 'Aromaterapia',
    'Acupuntura', 'Ayurveda', 'Constelação Familiar', 'Numerologia',
  ];

  const ratingOptions: FilterOption[] = [
    { label: '4.5+ estrelas', value: 4.5 },
    { label: '4.0+ estrelas', value: 4.0 },
    { label: '3.5+ estrelas', value: 3.5 },
    { label: 'Qualquer', value: 0 },
  ];

  const priceOptions: FilterOption[] = [
    { label: 'Até R$ 100', value: 100 },
    { label: 'Até R$ 200', value: 200 },
    { label: 'Até R$ 300', value: 300 },
    { label: 'Até R$ 500', value: 500 },
    { label: 'Qualquer', value: 0 },
  ];

  const sortOptions: FilterOption[] = searchType === 'professionals' ? [
    { label: 'Melhor avaliação', value: 'rating' },
    { label: 'Menor preço', value: 'price' },
    { label: 'Mais experiência', value: 'hours' },
    { label: 'Mais avaliações', value: 'reviews' },
  ] : [
    { label: 'Mais recente', value: 'createdAt' },
    { label: 'Menor preço', value: 'price' },
    { label: 'Nome A-Z', value: 'name' },
  ];

  // Search function
  const performSearch = async (resetPage = false) => {
    setIsLoading(true);
    if (resetPage) setPage(1);

    try {
      const params = new URLSearchParams({
        page: resetPage ? '1' : page.toString(),
        limit: '20',
        q: query,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '' && v !== 0)
        ),
      });

      // Using the api client or fetch
      const endpoint = searchType === 'professionals' 
        ? `/api/search/professionals?${params}`
        : `/api/search/products?${params}`;
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (resetPage) {
          setResults(data.data || []);
        } else {
          setResults(prev => [...prev, ...(data.data || [])]);
        }
        setTotalPages(data.pagination?.totalPages || 1);
        setHasMore(data.pagination?.hasNext || false);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, filters]);

  // Filter panel
  const FilterPanel = () => (
    <div className={`fixed inset-0 z-[250] bg-nature-50 transition-transform duration-300 ${showFilters ? 'translate-x-0' : 'translate-x-full'}`}>
      <header className="flex items-center justify-between px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100">
        <h3 className="text-lg font-serif italic text-nature-900">Filtros</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => setFilters({})}
            className="text-[10px] font-bold text-rose-500 uppercase tracking-widest"
          >
            Limpar
          </button>
          <button 
            onClick={() => setShowFilters(false)}
            className="p-2 bg-nature-50 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-200px)]">
        {searchType === 'professionals' && (
          <>
            {/* Specialty filter */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Especialidade</h4>
              <div className="flex flex-wrap gap-2">
                {specialties.map(spec => (
                  <button
                    key={spec}
                    onClick={() => setFilters(f => ({ ...f, specialty: f.specialty === spec ? undefined : spec }))}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      filters.specialty === spec 
                        ? 'bg-nature-900 text-white' 
                        : 'bg-white border border-nature-200 text-nature-600'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating filter */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
                <Star size={14} /> Avaliação mínima
              </h4>
              <div className="space-y-2">
                {ratingOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters(f => ({ ...f, minRating: opt.value as number }))}
                    className={`w-full p-4 rounded-2xl text-left flex items-center justify-between transition-all ${
                      filters.minRating === opt.value
                        ? 'bg-primary-50 border-2 border-primary-200'
                        : 'bg-white border border-nature-100'
                    }`}
                  >
                    <span className="text-sm font-medium text-nature-900">{opt.label}</span>
                    {filters.minRating === opt.value && <Check size={18} className="text-primary-600" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Price filter */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
            <DollarSign size={14} /> Preço máximo
          </h4>
          <div className="space-y-2">
            {priceOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilters(f => ({ ...f, maxPrice: opt.value as number }))}
                className={`w-full p-4 rounded-2xl text-left flex items-center justify-between transition-all ${
                  filters.maxPrice === opt.value
                    ? 'bg-primary-50 border-2 border-primary-200'
                    : 'bg-white border border-nature-100'
                }`}
              >
                <span className="text-sm font-medium text-nature-900">{opt.label}</span>
                {filters.maxPrice === opt.value && <Check size={18} className="text-primary-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Ordenar por</h4>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilters(f => ({ ...f, sortBy: opt.value as string }))}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  filters.sortBy === opt.value 
                    ? 'bg-nature-900 text-white' 
                    : 'bg-white border border-nature-200 text-nature-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-nature-100 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => { performSearch(true); setShowFilters(false); }}
          className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );

  // Active filters count
  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 0).length;

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <header className="flex-none px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 bg-white border-b border-nature-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onClose} className="p-2 bg-nature-50 rounded-xl text-nature-600 active:scale-90 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-serif italic text-nature-900">
            Buscar {searchType === 'professionals' ? 'Guardiões' : 'Produtos'}
          </h2>
        </div>

        {/* Search input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === 'professionals' ? 'Nome, especialidade...' : 'Nome do produto...'}
              className="w-full bg-nature-50 pl-12 pr-4 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className={`px-4 rounded-2xl flex items-center gap-2 transition-all ${
              activeFiltersCount > 0 
                ? 'bg-primary-500 text-white' 
                : 'bg-nature-100 text-nature-600'
            }`}
          >
            <SlidersHorizontal size={18} />
            {activeFiltersCount > 0 && (
              <span className="text-[10px] font-bold">{activeFiltersCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && results.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white h-24 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-nature-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-nature-400" />
            </div>
            <h3 className="text-lg font-serif italic text-nature-900">Nenhum resultado</h3>
            <p className="text-sm text-nature-400 mt-2">Tente ajustar seus filtros ou buscar por outro termo</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">
              {results.length} resultados encontrados
            </p>

            {searchType === 'professionals' ? (
              results.map(pro => (
                <button
                  key={pro.id}
                  onClick={() => onSelectProfessional?.(pro)}
                  className="w-full bg-white p-5 rounded-[2rem] border border-nature-100 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all text-left"
                >
                  <DynamicAvatar user={{ name: pro.name, avatar: pro.avatar }} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-nature-900 truncate">{pro.name}</h4>
                    <p className="text-[10px] text-nature-400 font-bold uppercase tracking-tighter truncate">
                      {Array.isArray(pro.specialty) ? pro.specialty.join(' • ') : pro.specialty}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-amber-500 text-xs">
                        <Star size={12} fill="currentColor" />
                        <span className="font-bold">{pro.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                      <span className="text-xs text-primary-600 font-medium">{pro.pricePerSession} cr</span>
                      {pro.location && (
                        <div className="flex items-center gap-1 text-nature-400 text-xs">
                          <MapPin size={10} />
                          <span>{pro.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {results.map(product => (
                  <button
                    key={product.id}
                    onClick={() => onSelectProduct?.(product)}
                    className="bg-white rounded-[2rem] border border-nature-100 overflow-hidden shadow-sm text-left"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                      <span className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-bold uppercase tracking-widest">
                        {product.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-nature-900 text-sm truncate">{product.name}</h4>
                      <span className="text-sm font-serif italic text-primary-700">R$ {product.price?.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {hasMore && (
              <button
                onClick={() => { setPage(p => p + 1); performSearch(); }}
                disabled={isLoading}
                className="w-full py-4 bg-nature-100 text-nature-600 rounded-2xl text-xs font-bold uppercase tracking-widest"
              >
                {isLoading ? 'Carregando...' : 'Carregar mais'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel />
    </div>
  );
};

export default AdvancedSearchScreen;
