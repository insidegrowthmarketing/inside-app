"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface AutoCuraToastProps {
  faturasGeradas: number;
}

export function AutoCuraToast({ faturasGeradas }: AutoCuraToastProps) {
  useEffect(() => {
    if (faturasGeradas > 0) {
      toast.info(`${faturasGeradas} faturas geradas automaticamente`);
    }
  }, [faturasGeradas]);

  return null;
}
