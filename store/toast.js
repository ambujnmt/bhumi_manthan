// import { create } from 'zustand'

// export const useStoreToast = create((set)=>({
//     toastDetails: null,
//     setShowToast: (detail, summary=null, severity='success', life=3000) => set({ toastDetails: {severity, summary, detail, life: life} }),
// }))


import { create } from "zustand";

export const useStoreToast = create((set) => ({
  toastDetails: null,

  setShowToast: (toastData) => {
    set({ toastDetails: toastData });
  },

  clearToast: () => set({ toastDetails: null })
}));

// Shortcut: showToast("Saved successfully.") / showToast("Failed.", "error")
export const showToast = (detail, severity = "success", life = 3000) => {
  useStoreToast.getState().setShowToast({ detail, severity, life });
};
