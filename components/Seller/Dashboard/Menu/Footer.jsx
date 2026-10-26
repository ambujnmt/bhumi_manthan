import { Card } from "@heroui/react";
import React from "react";
import { AiFillHeart } from "react-icons/ai";

export default function Footer() {
  return (
    <Card className="mx-4 mb-3">
      <div className="rounded-3xl">
        <div className="px-3 sm:px-4 py-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 text-gray-500 text-xs sm:text-sm">
            
            {/* Left Text */}
            <span className="text-center sm:text-left">
              Copyright © 2025 All rights reserved.
            </span>

            {/* Right Text */}
            <span className="flex items-center justify-center sm:justify-end gap-1 text-center sm:text-right">
              Developed By
              <span className="font-medium">NMT Technologies</span>
              <AiFillHeart className="text-red-500" size={16} />
            </span>

          </div>

        </div>
      </div>
    </Card>
  );
}