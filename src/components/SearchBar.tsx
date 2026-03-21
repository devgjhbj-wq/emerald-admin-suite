import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
  storageKey?: string;
  maxHistory?: number;
  debounceMs?: number;
  modes?: { value: string; label: string }[];
  selectedMode?: string;
  onModeChange?: (mode: string) => void;
  hideButton?: boolean;
}

const SearchBar = ({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = 'Search...', 
  loading = false,
  storageKey = 'search_history',
  maxHistory = 5,
  debounceMs = 300,
  modes,
  selectedMode,
  onModeChange,
  hideButton = false
}: SearchBarProps) => {
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [storageKey]);

  // Handle input changes with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Update suggestions with debounce
    debounceTimer.current = setTimeout(() => {
      if (newValue.trim()) {
        const filtered = history.filter(item =>
          item.toLowerCase().includes(newValue.toLowerCase())
        );
        setSuggestions(filtered.slice(0, maxHistory));
      } else {
        setSuggestions(history.slice(0, maxHistory));
      }
    }, debounceMs);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    if (value.trim()) {
      // Add to history
      const newHistory = [value, ...history.filter(item => item !== value)].slice(0, maxHistory);
      setHistory(newHistory);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      } catch {
        // Silently fail if localStorage is not available
      }
      setShowSuggestions(false);
      onSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    // Don't auto-search, let user click search button
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSuggestions([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-0.5 items-center">
        {/* Mode Toggle */}
        {modes && selectedMode && onModeChange && (
          <div className="flex-shrink-0">
            <ToggleGroup 
              type="single" 
              value={selectedMode} 
              onValueChange={onModeChange}
              className="border border-border bg-secondary/30 rounded p-0.5"
            >
              {modes.map((mode) => (
                <ToggleGroupItem 
                  key={mode.value}
                  value={mode.value}
                  className="text-[10px] h-6 px-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label={mode.label}
                >
                  {mode.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
        
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="bg-secondary/50 text-foreground placeholder:text-muted-foreground border-border w-full h-6 px-2 py-0.5 text-[11px] pr-6"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        {!hideButton && (
          <Button 
            onClick={handleSearch} 
            disabled={loading || !value.trim()} 
            className="h-6 px-2 whitespace-nowrap text-[11px] flex-shrink-0"
          >
            <Search className="w-2.5 h-2.5 mr-1" />
            {loading ? 'Searching...' : 'Go'}
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-0.5 bg-card border border-border rounded-sm shadow-lg z-50">
          <div className="max-h-40 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-2 py-1 text-xs hover:bg-secondary/50 transition-colors flex items-center gap-1 first:rounded-t-sm last:rounded-b-sm"
              >
                <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="w-full text-left px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary/50 transition-colors border-t border-border"
              >
                Clear history
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state message */}
      {showSuggestions && suggestions.length === 0 && value === '' && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-0.5 bg-card border border-border rounded-sm shadow-lg z-50">
          <div className="p-1 text-[10px] text-muted-foreground">
            <p className="px-2 py-0.5 font-semibold">Recent</p>
            {history.slice(0, maxHistory).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(item)}
                className="w-full text-left px-2 py-1 text-xs hover:bg-secondary/50 transition-colors rounded flex items-center gap-1"
              >
                <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{item}</span>
              </button>
            ))}
            <button
              onClick={handleClearHistory}
              className="w-full text-left px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary/50 transition-colors rounded"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
