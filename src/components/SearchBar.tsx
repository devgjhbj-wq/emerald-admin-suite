import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
}

const SearchBar = ({ value, onChange, onSearch, placeholder = 'Search...', loading }: SearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex gap-1.5">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-secondary/50 text-foreground placeholder:text-muted-foreground border-border max-w-xs"
      />
      <Button onClick={onSearch} disabled={loading || !value.trim()} size="sm">
        <Search className="w-3.5 h-3.5 mr-1" />
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </div>
  );
};

export default SearchBar;
