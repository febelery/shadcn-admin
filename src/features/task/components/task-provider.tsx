import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Task } from '../data/schema'

type TaskDialogType = 'create' | 'update' | 'delete' | 'import'

type TaskContextType = {
  open: TaskDialogType | null
  setOpen: (str: TaskDialogType | null) => void
  currentRow: Task | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Task | null>>
}

const TaskContext = React.createContext<TaskContextType | null>(null)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<TaskDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Task | null>(null)

  return (
    <TaskContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </TaskContext>
  )
}

export const useTask = () => {
  const taskContext = React.use(TaskContext)

  if (!taskContext) {
    throw new Error('useTask has to be used within <TaskContext>')
  }

  return taskContext
}
