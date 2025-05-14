
import { useToast as useToastShadcn } from "@/components/ui/use-toast";
import { toast as toastShadcn } from "@/components/ui/use-toast";

// Re-export the hook and toast function from shadcn/ui
// This provides a central place to manage toast functionality
export const useToast = useToastShadcn;
export const toast = toastShadcn;

// Add typescript export to ensure types are preserved
export type { Toast, ToasterToast } from "@/components/ui/use-toast";
