'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  placeholder?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  categories,
  placeholder = 'Kategori seçin veya yazın...',
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter categories based on input
  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (category: string) => {
    onChange(category);
    setInputValue(category);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setOpen(true);
  };

  const handleClear = () => {
    onChange('');
    setInputValue('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="pr-20"
          />
          <div className="absolute right-0 top-0 h-full flex">
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-full px-2"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-full px-2"
              onClick={() => setOpen(!open)}
            >
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {open && (filteredCategories.length > 0 || inputValue) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCategories.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Yeni kategori: &quot;{inputValue}&quot;
            </div>
          ) : (
            <div className="py-1">
              {filteredCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between',
                    value === category && 'bg-accent'
                  )}
                  onClick={() => handleSelect(category)}
                >
                  <span>{category}</span>
                  {value === category && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
