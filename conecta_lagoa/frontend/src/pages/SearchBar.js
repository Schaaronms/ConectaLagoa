import { useState, useEffect } from 'react';
import { Search } from 'lucide-react'; // ou use heroicons, font-awesome, etc.

export default function SearchBar({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce simples (evita buscar a cada tecla)
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Cargo, empresa, palavra-chave..."
        className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                   text-lg shadow-sm placeholder-gray-400"
                   
      />
    </div>
  );
}