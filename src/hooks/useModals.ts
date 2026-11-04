import { useCallback, useState } from 'react'

export type ModalId =
  | 'commit'
  | 'branch'
  | 'merge'
  | 'conflict'
  | 'pr'
  | 'trophies'
  | 'tutorial'
  | 'settings'

/** Only one modal can be open at a time, so a single id replaces 8 booleans. */
export function useModals(initial: ModalId | null = null) {
  const [openModalId, setOpenModalId] = useState<ModalId | null>(initial)

  const openModal = useCallback((id: ModalId) => setOpenModalId(id), [])
  const closeModal = useCallback(() => setOpenModalId(null), [])
  const isOpen = (id: ModalId) => openModalId === id

  return { openModalId, isOpen, openModal, closeModal }
}
