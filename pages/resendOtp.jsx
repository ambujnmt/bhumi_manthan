import React from "react";
import ResendOtp from "../components/Forms/ResendOtp";
import GuestRoute from "../components/GuestRoute/GuestRoute";

export default function ResendOtpPage() {
  return (
    <GuestRoute>
      <ResendOtp />
    </GuestRoute>
  );
}