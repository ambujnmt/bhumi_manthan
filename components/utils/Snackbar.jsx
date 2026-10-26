import React, {useState, useEffect} from 'react'
import {useStoreSnackbar} from '../../store/snackbar'
import { FaXmark } from "react-icons/fa6";
export default function Snackbar() {
    const { isOpen, title, description, color, position, time, hideSnackbar } = useStoreSnackbar();
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      if (isOpen) {
        setVisible(true);
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(hideSnackbar, 300); // Delay to allow the transition to complete
        }, time);
        return () => clearTimeout(timer);
      } else {
        setVisible(false);
      }
    }, [isOpen, hideSnackbar]);
  
    if (!isOpen && !visible) return null;
  
    const positionStyle = getPositionStyle(position);
    return (
      <div
        className={`snackbar bg-${color=='default' ? 'default-500': color}`}
        style={{
          ...snackbarContainerStyle,
          ...positionStyle,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className='w-full'>
          <div className='flex justify-between mb-2'>
              <div className='font-bold text-base'>{title}</div>
              <FaXmark className="cursor-pointer font-bold text-3xl	" onClick={() => {setVisible(false);hideSnackbar()}} />
  
          </div>
  
          <p className='text-sm'>{description}</p>
        </div>
      </div>
    );
}
const getPositionStyle = (position)=> {
    const positions = {
      'top-left': { top: '20px', left: '20px', transform: 'none' },
      'top-right': { top: '20px', right: '20px', transform: 'none' },
      'bottom-left': { bottom: '20px', left: '20px', transform: 'none' },
      'bottom-right': { bottom: '20px', right: '20px', transform: 'none' },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
    };
    return positions[position] || positions['bottom-center'];
  };
  
  
  const snackbarContainerStyle = {
    position: 'fixed',
    color: '#fff',
    padding: '16px 24px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '300px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    zIndex: 1000,
    transition: 'opacity 0.3s, transform 0.3s',
  };
