import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onColorFilter: (color: string) => void;
}

export default function SearchBar({ onSearch, onColorFilter }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleColorClick = (color: string) => {
    const newColor = selectedColor === color ? '' : color;
    setSelectedColor(newColor);
    onColorFilter(newColor);
  };

  const commonColors = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Green', hex: '#00FF00' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#808080' },
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by tags or description..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onSearch('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">Filter by color:</span>
        <div className="flex gap-2 flex-wrap">
          {commonColors.map((color) => (
            <button
              key={color.hex}
              onClick={() => handleColorClick(color.hex)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color.hex
                  ? 'border-blue-600 scale-110'
                  : 'border-gray-300 hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

