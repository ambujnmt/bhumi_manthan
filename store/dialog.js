import { create } from 'zustand'

export const useStoreDialog = create((set)=>({
    isVisible : false,
    setVisible: (status) => {
        set({ isVisible : status})

    } 
}))
