
import { useToast as useToastImpl, toast as toastImpl } from "@/hooks/use-toast";

// Re-export from the hooks directory to avoid circular imports
export const useToast = useToastImpl;
export const toast = toastImpl;

// Re-export types from toast.tsx for type consistency
export type { ToastProps as Toast, ToastActionElement as ToasterToast } from "@/components/ui/toast";
