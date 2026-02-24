import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => { onChange(localValue); }, 500);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="searchbar-wrapper">
      <Search className="searchbar-icon" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Cargo, empresa, palavra-chave..."
        className="searchbar-input"
      />
    </div>
  );
}
