import { cn } from "@/lib/utils";

interface CalculatorScreenProps {
  display: string;
  className?: string;
}

export const CalculatorScreen = ({ display, className }: CalculatorScreenProps) => {
  return (
    <div
      className={cn(
        "w-full h-20 bg-[hsl(142_30%_85%)] rounded-lg p-3 font-mono text-right",
        "border-2 border-[hsl(142_30%_75%)] shadow-inner",
        "flex items-end justify-end",
        className
      )}
    >
      <div className="text-[hsl(142_30%_15%)] text-lg font-semibold break-all">
        {display || '\u00A0'}
      </div>
    </div>
  );
};
