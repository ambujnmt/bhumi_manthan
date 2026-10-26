import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";

export default function Tmodal({ isOpen, onClose, title, children, footer, classNames, size = "md" }) {
  return (
   <Modal
  backdrop="opaque"
  size={size}
  isOpen={isOpen}
  onOpenChange={onClose}
  placement="auto"   // ✅ IMPORTANT (instead of center)
  scrollBehavior="inside"  // ✅ allows internal scrolling
  classNames={{
    base: "my-auto",   // ✅ removes top gap issue on mobile
    wrapper: "items-start sm:items-center", // ✅ top align mobile
  }}
>
      <ModalContent className="max-h-[90vh] overflow-y-auto">
        {() => (
          <>
            {title && <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>}
            <ModalBody>{children}</ModalBody>
            {footer && <ModalFooter>{footer}</ModalFooter>}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
