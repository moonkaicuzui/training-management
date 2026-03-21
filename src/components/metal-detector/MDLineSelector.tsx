/**
 * 라인 검색/선택 드롭다운
 * - 공장 선택 후 해당 공장의 라인 목록에서 검색+선택
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MDLineSelectorProps {
  factory: string;
  line: string;
  availableLines: string[];
  placeholder?: string;
  onSelect: (line: string) => void;
}

export default function MDLineSelector({
  factory,
  line,
  availableLines,
  placeholder,
  onSelect,
}: MDLineSelectorProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredLines = useMemo(() => {
    if (!search.trim()) return availableLines;
    return availableLines.filter((l) => l.includes(search));
  }, [availableLines, search]);

  return (
    <div className="space-y-1">
      <Label>{t('metalDetector.line')}</Label>
      <div className="relative">
        <Input
          placeholder={placeholder || (factory ? `${factory}-1` : '1-1')}
          value={line || search}
          onChange={(e) => {
            setSearch(e.target.value);
            setDropdownOpen(true);
            if (line) onSelect('');
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
        />
        {line && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => { onSelect(''); setSearch(''); setDropdownOpen(true); }}
          >
            <span className="text-xs">{'\u2715'}</span>
          </button>
        )}
        {dropdownOpen && !line && factory && (
          <div className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
            {filteredLines.length > 0 ? (
              filteredLines.map((l) => (
                <button
                  key={l}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(l);
                    setSearch('');
                    setDropdownOpen(false);
                  }}
                >
                  {l}
                </button>
              ))
            ) : (
              <div className="px-3 py-1.5 text-sm text-muted-foreground">{t('common.noResults')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
