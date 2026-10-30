import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";

// noScroll: content fits as is, no scrollbar inside the modal
export default function Tmodal({ isOpen, onClose, title, children, footer, classNames, size = "md", noScroll = false }) {
  return (
   <Modal
  backdrop="opaque"
  size={size}
  isOpen={isOpen}
  onOpenChange={onClose}
  placement="auto"   // ✅ IMPORTANT (instead of center)
  scrollBehavior="inside"  // ✅ allows internal scrolling
  classNames={{
    base: `my-auto ${classNames?.base || ""}`,   // ✅ removes top gap issue on mobile (+ custom width etc.)
    wrapper: "items-start sm:items-center", // ✅ top align mobile
  }}
>
      <ModalContent className={noScroll ? "overflow-hidden" : "max-h-[90vh] overflow-y-auto"}>
        {() => (
          <>
            {title && <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>}
            <ModalBody className={noScroll ? "overflow-visible" : undefined}>{children}</ModalBody>
            {footer && <ModalFooter>{footer}</ModalFooter>}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
