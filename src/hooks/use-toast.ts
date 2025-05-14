
import * as React from "react"
import {
  useToast as useToastOriginal,
  toast as toastOriginal,
} from "@radix-ui/react-toast"
import type { ToastProps, ToastActionElement } from "@/components/ui/toast"

// Create a custom hook that wraps the shadcn toast functionality
export const useToast = () => {
  const methods = useToastOriginal()
  return {
    ...methods,
    // You can add custom behavior here if needed
  }
}

// Create the toast function that uses shadcn's implementation
export const toast = toastOriginal

// Re-export the types from components/ui/toast.tsx
export type { ToastProps as Toast, ToastActionElement as ToasterToast }
