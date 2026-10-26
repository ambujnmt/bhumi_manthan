import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaShippingFast,
  FaTimesCircle,
} from "react-icons/fa";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import { fetchOrderDetail, fetchOrderDetailNew, createPaypalOrder, capturePaypalOrder, } from "../../../utils/fetchApi";
import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";

 function MyOrderDetailContent() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalMessage, setPaypalMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const loadOrderDetail = async () => {
      setLoading(true);
      const data = await fetchOrderDetailNew(id);
      setOrder(data);
      setLoading(false);
    };

    loadOrderDetail();
  }, [id]);


const reloadOrderDetail = async () => {
  if (!id) return;

  try {
    const data = await fetchOrderDetailNew(id);
    setOrder(data);
  } catch (error) {
    console.error("Reload Order Detail Error:", error);
  }
};


const handlePaypalApprove = async (data) => {
  try {
    setPaypalLoading(true);
    setPaypalMessage("");

    console.log("PayPal Approved Data:", data);

    const capturePayload = {
      paypal_order_id: data.orderID,
      local_order_id: order.order_id,
    };

    console.log("Capture PayPal Payload:", capturePayload);

    const captureRes = await capturePaypalOrder(capturePayload);

    console.log("Capture PayPal Response:", captureRes);

    if (!captureRes?.status) {
      throw new Error(
        captureRes?.message
      );
    }

    setPaypalMessage(
      captureRes?.message
    );

    await reloadOrderDetail();

  } catch (error) {
    console.error("PayPal Capture Error:", error);

    setPaypalMessage(
      error?.message || "Payment failed. Please try again."
    );
  } finally {
    setPaypalLoading(false);
  }
};


// PayPal error
const handlePaypalError = (error) => {
  console.error("PayPal Error:", error);

  setPaypalMessage(
    "PayPal payment failed. Please try again."
  );
};



  const getStatusUI = (status) => {
    switch (status?.toLowerCase()) {
      case "placed":
        return {
          icon: <FaClock />,
          color: "text-yellow-600",
          label: "Order Placed",
        };

      case "awaiting_payment":
        return {
          icon: <FaClock />,
          color: "text-yellow-600",
          label: "Awaiting Payment",
        };

      case "confirmed":
        return {
          icon: <FaCheckCircle />,
          color: "text-green-600",
          label: "Confirmed",
        };

      case "shipped":
        return {
          icon: <FaShippingFast />,
          color: "text-blue-600",
          label: "Shipped",
        };

      case "delivered":
        return {
          icon: <FaCheckCircle />,
          color: "text-green-600",
          label: "Delivered",
        };

      case "cancelled":
        return {
          icon: <FaTimesCircle />,
          color: "text-red-600",
          label: "Cancelled",
        };

      default:
        return {
          icon: <FaClock />,
          color: "text-gray-500",
          label: status,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center text-gray-500 py-20">
        Order not found
      </div>
    );
  }

  const statusUI = getStatusUI(order.order_status);
  const address = order.shipping_address;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* ORDER STATUS */}
      <div className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">        <div>
        <h1 className="text-base sm:text-lg font-semibold text-gray-900">
          Order #{order.order_number}
        </h1>
        <p className="text-sm text-gray-500">
          Placed on {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

        <div className={`flex items-center gap-2 font-medium ${statusUI.color}`}>
          {statusUI.icon} {statusUI.label}
        </div>
      </div>

      {/* SHIPPING ADDRESS */}
      <div className="border rounded-xl p-4 sm:p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Shipping Address</h2>
        <div className="text-sm text-gray-700 leading-relaxed">
          <div>{address.first_name} {address.last_name}</div>
          <div>{address.address}</div>
          <div>{address.city}, {address.state} - {address.zip_code}</div>
          <div>Phone: {address.phone}</div>
          <div>Email: {address.email}</div>
        </div>
      </div>

      {/* ORDER ITEMS */}
      <div className="border rounded-xl p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.order_item_id}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 border-b pb-4 last:border-b-0"
            >
              <img
                src={item.images?.[0]}
                alt={item.product_name}
                className="w-full sm:w-20 h-40 sm:h-20 rounded-md object-cover"
              />

              <div className="flex-1">
                <div className="font-medium text-gray-900 sm:text-right">
                  {item.product_name}
                </div>

                <div className="text-sm text-gray-600 mt-1">
                  Quantity: {item.quantity}
                </div>
                <div className="text-sm text-gray-600">
                  Unit Price: ${item.unit_price}
                </div>
              </div>

              <div className="font-medium text-gray-900 sm:text-right">
                ${item.total_price}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAYMENT & TOTALS */}
      <div className="border rounded-xl p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Payment Summary</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
          <div>
            <div className="font-medium">Items</div>
            <div>{order.total_items}</div>
          </div>

          <div>
            <div className="font-medium">Cart Total</div>
            <div>${order.cart_total}</div>
          </div>

          <div>
            <div className="font-medium">Shipping</div>
            <div>${order.shipping_price}</div>
          </div>

          <div>
            <div className="font-medium">Grand Total</div>
            <div className="font-semibold text-black">
              ${order.grand_total}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-700 leading-relaxed">
          <span className="font-medium">Payment Method:</span>{" "}
          {order.payment_method}
          <br />
          <span className="font-medium">Payment Status:</span>{" "}
          {order.payment_status}
        </div>


{order.order_status?.toLowerCase() === "awaiting_payment" && (
  <div className="mt-6 border-t pt-5">

    <h3 className="font-semibold text-gray-900 mb-2">
      Complete Your Payment
    </h3>

    <p className="text-sm text-gray-600 mb-4">
      Your order has been created. Please complete the payment using PayPal.
    </p>

    {/* PayPal success/error message */}
    {paypalMessage && (
      <div className="mb-4 p-3 rounded-lg bg-gray-100 text-sm text-gray-700">
        {paypalMessage}
      </div>
    )}

    {paypalLoading ? (
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    ) : (
      <PayPalButtons
        style={{
          layout: "vertical",
          shape: "rect",
        }}

        createOrder={async () => {
          try {
            console.log(
              "Creating PayPal order for:",
              order.grand_total
            );

            const paypalRes = await createPaypalOrder(
              order.grand_total
            );

            console.log(
              "Create PayPal Order Response:",
              paypalRes
            );

            if (!paypalRes?.paypal_order_id) {
              throw new Error(
                paypalRes?.message ||
                "PayPal order ID was not returned"
              );
            }

            return paypalRes.paypal_order_id;

          } catch (error) {
            console.error(
              "PayPal createOrder Error:",
              error
            );

            setPaypalMessage(
              error?.message ||
              "Unable to create PayPal order."
            );

            throw error;
          }
        }}

        onApprove={handlePaypalApprove}

        onError={handlePaypalError}
      />
    )}

  </div>
)}


      </div>

    </div>
  );
}

export default function MyOrderDetail() {
  return (
    <PayPalScriptProvider
      options={{
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
      }}
    >
      <MyOrderDetailContent />
    </PayPalScriptProvider>
  );
}