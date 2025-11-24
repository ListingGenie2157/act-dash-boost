import { useState, useEffect } from 'react';
import { Type, Sun, Moon, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface ReadingPrefs {
  fontSize: 'small' | 'medium' | 'large';
  lineHeight: 'compact' | 'normal' | 'relaxed';
  theme: 'light' | 'sepia' | 'dark';
  width: number; // percentage 60-100
}

interface ReadingPreferencesProps {
  onPrefsChange?: (prefs: ReadingPrefs) => void;
}

export function ReadingPreferences({ onPrefsChange }: ReadingPreferencesProps) {
  const [prefs, setPrefs] = useState<ReadingPrefs>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('reading-preferences');
    return saved ? JSON.parse(saved) : {
      fontSize: 'medium',
      lineHeight: 'normal',
      theme: 'light',
      width: 100
    };
  });

  // Save to localStorage whenever prefs change
  useEffect(() => {
    localStorage.setItem('reading-preferences', JSON.stringify(prefs));
    onPrefsChange?.(prefs);
  }, [prefs, onPrefsChange]);


  return (
    <div className="flex items-center gap-6 p-4 border-b bg-card/50 backdrop-blur-sm flex-wrap">
      {/* Font Size */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Size</Label>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={prefs.fontSize === 'small' ? 'default' : 'ghost'}
            className="h-8 w-8 p-0"
            onClick={() => setPrefs({ ...prefs, fontSize: 'small' })}
          >
            <Type className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={prefs.fontSize === 'medium' ? 'default' : 'ghost'}
            className="h-8 w-8 p-0"
            onClick={() => setPrefs({ ...prefs, fontSize: 'medium' })}
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={prefs.fontSize === 'large' ? 'default' : 'ghost'}
            className="h-8 w-8 p-0"
            onClick={() => setPrefs({ ...prefs, fontSize: 'large' })}
          >
            <Type className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Line Height */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Spacing</Label>
        <ToggleGroup
          type="single"
          value={prefs.lineHeight}
          onValueChange={(value) => value && setPrefs({ ...prefs, lineHeight: value as ReadingPrefs['lineHeight'] })}
        >
          <ToggleGroupItem value="compact" className="h-8 text-xs">Compact</ToggleGroupItem>
          <ToggleGroupItem value="normal" className="h-8 text-xs">Normal</ToggleGroupItem>
          <ToggleGroupItem value="relaxed" className="h-8 text-xs">Relaxed</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Theme */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Theme</Label>
        <ToggleGroup
          type="single"
          value={prefs.theme}
          onValueChange={(value) => value && setPrefs({ ...prefs, theme: value as ReadingPrefs['theme'] })}
        >
          <ToggleGroupItem value="light" className="h-8 w-8 p-0">
            <Sun className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="sepia" className="h-8 w-8 p-0">
            <Coffee className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" className="h-8 w-8 p-0">
            <Moon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Width Control */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <Label className="text-xs text-muted-foreground">Width</Label>
        <Slider
          value={[prefs.width]}
          onValueChange={([value]) => setPrefs({ ...prefs, width: value })}
          min={60}
          max={100}
          step={5}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-12 text-right">{prefs.width}%</span>
      </div>
    </div>
  );
}

// Helper hook to apply reading preferences to an element
export function useReadingPreferences() {
  const [prefs, setPrefs] = useState<ReadingPrefs | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('reading-preferences');
    if (saved) {
      setPrefs(JSON.parse(saved));
    }
  }, []);

  const getClassName = () => {
    if (!prefs) return '';
    
    const fontSizeMap = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };

    const lineHeightMap = {
      compact: 'leading-relaxed',
      normal: 'leading-loose',
      relaxed: 'leading-[2]'
    };

    const themeMap = {
      light: 'bg-background text-foreground',
      sepia: 'bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-50',
      dark: 'bg-slate-900 text-slate-100'
    };

    return `${fontSizeMap[prefs.fontSize]} ${lineHeightMap[prefs.lineHeight]} ${themeMap[prefs.theme]}`;
  };

  const getStyle = () => {
    if (!prefs) return {};
    return { maxWidth: `${prefs.width}%` };
  };

  return { prefs, getClassName, getStyle };
}
