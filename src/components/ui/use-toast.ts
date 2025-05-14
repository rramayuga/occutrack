
// Import from our custom hook implementation
import { useToast as useToastImplementation, toast as toastImplementation, Toast, ToasterToast } from "@/hooks/use-toast";

// Re-export from the hooks directory
export const useToast = useToastImplementation;
export const toast = toastImplementation;

// Re-export types from toast.tsx for type consistency
export type { ToastProps, ToastActionElement } from "@/components/ui/toast";
export type { Toast, ToasterToast };
