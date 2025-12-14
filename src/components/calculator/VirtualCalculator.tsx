import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CalculatorScreen } from './CalculatorScreen';
import { TI84_LAYOUT, BUTTON_COLORS, CalculatorButton } from './ti84Layout';

export type CalculatorMode = 'guided' | 'free';

interface VirtualCalculatorProps {
  mode?: CalculatorMode;
  highlightButtonId?: string; // For guided mode
  onButtonPress?: (buttonId: string) => void;
  display?: string;
  className?: string;
}

export const VirtualCalculator = ({
  mode = 'free',
  highlightButtonId,
  onButtonPress,
  display = '',
  className,
}: VirtualCalculatorProps) => {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const handleButtonClick = (buttonId: string) => {
    // Visual feedback
    setPressedButton(buttonId);
    setTimeout(() => setPressedButton(null), 150);

    // Notify parent
    onButtonPress?.(buttonId);
  };

  const renderButton = (button: CalculatorButton) => {
    const isHighlighted = mode === 'guided' && highlightButtonId === button.id;
    const isPressed = pressedButton === button.id;
    const colors = BUTTON_COLORS[button.color];

    return (
      <button
        key={button.id}
        onClick={() => handleButtonClick(button.id)}
        className={cn(
          'rounded-md font-semibold transition-all duration-150',
          'flex flex-col items-center justify-center',
          'shadow-md active:shadow-sm active:translate-y-0.5',
          'min-h-[2.5rem] px-2 py-1',
          button.width === 'wide' ? 'col-span-2' : '',
          isPressed && 'scale-95',
          isHighlighted && 'animate-pulse ring-4 ring-success ring-offset-2'
        )}
        style={{
          backgroundColor: isPressed
            ? colors.hover
            : colors.bg,
          color: colors.text,
        }}
      >
        {/* Secondary label (small, top) */}
        {button.secondaryLabel && (
          <span className="text-[0.5rem] leading-none opacity-70">
            {button.secondaryLabel}
          </span>
        )}
        
        {/* Main label */}
        <span className={cn(
          'font-bold leading-tight',
          button.secondaryLabel ? 'text-xs' : 'text-sm'
        )}>
          {button.label}
        </span>

        {/* Alpha label (small, bottom) */}
        {button.alphaLabel && (
          <span className="text-[0.5rem] leading-none opacity-70">
            {button.alphaLabel}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-b from-[hsl(215_25%_20%)] to-[hsl(215_25_15%)]',
        'rounded-2xl p-6 shadow-2xl',
        'border-4 border-[hsl(215_25%_10%)]',
        'max-w-sm mx-auto',
        className
      )}
    >
      {/* Calculator Brand */}
      <div className="text-center mb-4">
        <div className="text-white font-bold text-lg tracking-wider">
          TI-84 Plus CE
        </div>
        <div className="text-white/60 text-xs">
          Texas Instruments
        </div>
      </div>

      {/* Screen */}
      <div className="mb-4">
        <CalculatorScreen display={display} />
      </div>

      {/* Button Grid */}
      <div className="space-y-2">
        {TI84_LAYOUT.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={cn(
              'grid gap-1.5',
              rowIndex === 3 || rowIndex === 5 ? 'grid-cols-1 justify-items-center' : 'grid-cols-5'
            )}
          >
            {row.map(renderButton)}
          </div>
        ))}
      </div>

      {/* Mode Indicator */}
      {mode === 'guided' && highlightButtonId && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-success/20 text-success px-3 py-1.5 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Guided Mode: Press the highlighted button
          </div>
        </div>
      )}
    </div>
  );
};
