import { useEffect, useState } from "react";
import { useStoreToast } from "../store/toast";
import { AiOutlineCheckCircle, AiOutlineClose, AiOutlineCloseCircle } from "react-icons/ai";

export default function Toast() {
  const { toastDetails } = useStoreToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toastDetails) return;

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, toastDetails.life || 3000);

    return () => clearTimeout(timer);
  }, [toastDetails]);

  if (!toastDetails || !visible) return null;

  const isSuccess = toastDetails.severity === "success";

  return (
    <div
      className="fixed top-6 right-4 sm:right-6 z-[9999] bg-white shadow-lg rounded-md w-[350px] max-w-[calc(100vw-2rem)] flex items-center justify-between p-3 border border-gray-200 animate-fadeIn"
      style={{ animation: "fadeIn 0.3s ease-in-out" }}
    >
      {/* ICON + TEXT */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${
            isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? <AiOutlineCheckCircle size={22} /> : <AiOutlineCloseCircle size={22} />}
        </div>

        <span className="text-gray-800 font-medium">{toastDetails.detail}</span>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={() => setVisible(false)}
        className="text-gray-500 hover:text-black"
      >
        <AiOutlineClose size={18} />
      </button>

      {/* Progress Bar */}
      <div
        className={`absolute bottom-0 left-0 h-[4px] rounded-b-md ${
          isSuccess ? "bg-green-500" : "bg-red-500"
        }`}
        style={{ width: "100%", animation: `shrink ${toastDetails.life || 3000}ms linear forwards` }}
      ></div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
