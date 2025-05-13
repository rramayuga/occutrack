
import * as React from "react"
import { cn } from "@/lib/utils"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Define ToasterToast type without circular references
export interface ToasterToast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "default" | "destructive"
  className?: string
}

// Define Toast type without circular references
export type Toast = Omit<ToasterToast, "id">

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToasterState = {
  toasts: ToasterToast[]
}

let memoryState: ToasterState = {
  toasts: [],
}

const listeners: ((state: ToasterState) => void)[] = []

function dispatch(nextState: ToasterState) {
  memoryState = nextState
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

export function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: Toast) =>
    dispatch({
      toasts: memoryState.toasts.map((t) =>
        t.id === id ? { ...t, ...props } : t
      ),
    })
  const dismiss = () => dispatch({
    toasts: memoryState.toasts.filter((t) => t.id !== id),
  })

  dispatch({
    toasts: [
      ...memoryState.toasts,
      { ...props, id, dismiss, update },
    ].slice(-TOAST_LIMIT),
  })

  return {
    id,
    dismiss,
    update,
  }
}

export function useToast() {
  const [state, setState] = React.useState<ToasterState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        dispatch({
          toasts: memoryState.toasts.filter((t) => t.id !== toastId),
        })
      } else {
        dispatch({ toasts: [] })
      }
    },
  }
}

function genId() {
  return Math.random().toString(36).slice(2)
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
