
import { create } from 'zustand'

export const useStoreSnackbar = create((set) => ({
  isOpen: false,
  title: '',
  description: '',
  color: 'default',
  position: 'bottom-center',
  time: 3000,
  showSnackbar: (value) =>{
      
       set({ isOpen: true, title: value.title, description: value?.description, color: value?.color||'default', position: value?.position||'top-right', time: value?.time||3000 });
  },
  hideSnackbar: () => set({ isOpen: false, title: '', description: '', color: 'default', position: 'top-right', time: 3000 }),
}))