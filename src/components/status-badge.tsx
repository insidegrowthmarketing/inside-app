import { Badge } from "@/components/ui/badge";
import { STATUS_CLIENTE } from "@/types/cliente";
import { cn } from "@/lib/utils";

const corClasses: Record<string, string> = {
  zinc: "bg-zinc-700 text-zinc-200 hover:bg-zinc-700",
  blue: "bg-[#2D7CDB]/20 text-[#2D7CDB] hover:bg-[#2D7CDB]/20",
  green: "bg-[#E550A5]/15 text-[#E550A5] hover:bg-[#E550A5]/15",
  yellow: "bg-yellow-900 text-yellow-300 hover:bg-yellow-900",
  red: "bg-red-900 text-red-300 hover:bg-red-900",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const item = STATUS_CLIENTE.find((s) => s.value === status);
  if (!item) return null;

  return (
    <Badge className={cn("border-0 text-xs font-medium", corClasses[item.cor], className)}>
      {item.label}
    </Badge>
  );
}
