// import { create } from 'zustand'
import { create } from "zustand"
export const useStoreLoader = create((set)=>({
    isloading : false,
    setLoading: (status) => {
        set({ isloading : status})
    } 
}))
