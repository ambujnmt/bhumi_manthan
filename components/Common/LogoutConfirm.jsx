import { Button } from "@heroui/react";
import Tmodal from "../Tmodal/Tmodal";

export default function LogoutConfirm({ isOpen, onClose, onConfirm }) {
  return (
    <Tmodal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      noScroll
      title="Logout?"
      footer={
        <>
          <Button variant="light" onPress={onClose} className="font-medium text-[#62748E] hover:bg-gray-100">
            Cancel
          </Button>
          <Button onPress={onConfirm} className="bg-red-600 font-semibold text-white hover:bg-red-700">
            Logout
          </Button>
        </>
      }
    >
      <span className="text-sm text-[#62748E]">Are you sure you want to logout of your account?</span>
    </Tmodal>
  );
}
