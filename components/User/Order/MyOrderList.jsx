import React, { useEffect, useState } from 'react'
import {
    FaSearch, FaDownload, FaCheckCircle,
    FaTruck,
    FaFileInvoice,
    FaShoppingCart,
    FaShippingFast,
    FaClock,
    FaTimesCircle,
    FaChevronRight,
    FaChevronLeft,
    FaHeart,
    FaShoppingBag,
    FaTrash,
    FaEye
} from "react-icons/fa";
import { Link, Spinner } from "@heroui/react";
import { useRouter } from "next/router";
import { fetchUserOrders, cancelOrderRequest } from '../../../utils/fetchApi';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Tooltip } from "@heroui/react";

export default function MyOrderList({
    search = "",
    setSearch = () => { },
    timeFilter = "all",
    setTimeFilter = () => { },
    statusFilter = "all",
    setStatusFilter = () => { },
}) {
    const [activeTab, setActiveTab] = useState("orders");
    const router = useRouter();
    const { id: userId } = router.query;
    const [cancelLoadingId, setCancelLoadingId] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelSubmitting, setCancelSubmitting] = useState(false);
    const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");
    const [apiMessage, setApiMessage] = useState("");
    const [apiMessageType, setApiMessageType] = useState("");
    useEffect(() => {
        setCurrentPage(1);
    }, [orders]);


    useEffect(() => {
        if (!userId) return;

        const loadOrders = async () => {
            setLoadingOrders(true);
            const data = await fetchUserOrders(userId);
            setOrders(Array.isArray(data) ? data : []);
            setLoadingOrders(false);
        };

        loadOrders();
    }, [userId]);

    const getStatusUI = (order) => {
        switch (order.order_status?.toLowerCase()) {
            case "placed":
                return {
                    icon: <FaClock />,
                    color: "text-yellow-600",
                    label: "Placed",
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

            default:
                return {
                    icon: <FaClock />,
                    color: "text-gray-500",
                    label: order.order_status,
                };
        }
    };

    const handleExportOrders = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Order History", 14, 20);

        const tableData = filteredOrders.map((order) => [
            order.order_number,
            new Date(order.created_at).toLocaleDateString(),
            order.order_status,
            order.payment_status,
            `$${order.grand_total}`,
        ]);

        autoTable(doc, {
            startY: 30,
            head: [["Order ID", "Date", "Status", "Payment", "Total"]],
            body: tableData,
        });

        doc.save("Order_History.pdf");
    };

    const filteredOrders = orders.filter((order) => {

        // SEARCH FILTER
        const searchMatch =
            order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
            order.items?.some((item) =>
                item.product_name?.toLowerCase().includes(search.toLowerCase())
            );

        // STATUS FILTER
        const statusMatch =
            statusFilter === "all"
                ? true
                : order.order_status === statusFilter;

        // TIME FILTER
        let timeMatch = true;

        if (timeFilter !== "all") {
            const orderDate = new Date(order.created_at);
            const now = new Date();

            if (timeFilter === "last30") {
                const last30 = new Date();
                last30.setDate(now.getDate() - 30);
                timeMatch = orderDate >= last30;
            }

            if (timeFilter === "last90") {
                const last90 = new Date();
                last90.setDate(now.getDate() - 90);
                timeMatch = orderDate >= last90;
            }

            if (timeFilter === "2023") {
                timeMatch = orderDate.getFullYear() === 2023;
            }

            if (timeFilter === "2022") {
                timeMatch = orderDate.getFullYear() === 2022;
            }
        }

        return searchMatch && statusMatch && timeMatch;
    });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3; // change if needed
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);


    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const tabs = [
        { id: "orders", label: "Order History" },
        { id: "wishlist", label: "Wishlist" },
    ];

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const goPrev = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const goNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };







    const handleDownloadInvoice = (order) => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text("INVOICE", 14, 20);

        doc.setFontSize(12);
        doc.text(`Order Number: ${order.order_number}`, 14, 30);
        doc.text(`Order Date: ${new Date(order.created_at).toLocaleDateString()}`, 14, 38);
        doc.text(`Payment Status: ${order.payment_status}`, 14, 46);
        doc.text(`Order Status: ${order.order_status}`, 14, 54);

        // Table Data
        const tableData = order.items.map(item => [
            item.product_name,
            item.quantity,
            `$${item.unit_price}`,
            `$${item.total_price}`
        ]);

        autoTable(doc, {
            startY: 65,
            head: [["Product", "Qty", "Unit Price", "Total"]],
            body: tableData,
        });

        // Totals
        const finalY = doc.lastAutoTable.finalY + 10;

        doc.text(`Cart Total: $${order.cart_total}`, 14, finalY);
        doc.text(`Shipping: $${order.shipping_price}`, 14, finalY + 8);
        doc.text(`Grand Total: $${order.grand_total}`, 14, finalY + 16);

        doc.save(`Invoice_${order.order_number}.pdf`);
    };

    const renderContent = () => {
        switch (activeTab) {
            case "orders":
                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                        </div>

                        {/* Order List */}
                        <div className="space-y-4">
                            {loadingOrders && (
                                <div className="text-center text-gray-500 py-6">
                                    <Spinner />
                                </div>
                            )}

                            {!loadingOrders && orders.length === 0 && (
                                <div className="text-center text-gray-500 py-10">
                                    No orders found
                                </div>
                            )}
                            {!loadingOrders &&
                                paginatedOrders.map((order) => {
                                    const statusUI = getStatusUI(order);

                                    const cancelStatus = (order?.cancel_status)
                                        ?.toLowerCase()
                                        ?.trim();

                                    const canCancel = cancelStatus === "none";

                                    return (
                                        <Link
                                            key={order.order_id}
                                            href={`/user/order/myOrderDetail/${order.order_id}`}
                                            className="block cursor-pointer"
                                        >
                                            <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition">

                                                {/* Header */}
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900 sm:text-right">
                                                            Order #{order.order_number}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Placed on{" "}
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                            {cancelStatus !== "none" && (
                                                            <div className="text-sm font-medium text-red-600">
                                                                Cancel Status: {cancelStatus}
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`flex items-center gap-2 text-sm font-medium ${statusUI.color}`}
                                                        >
                                                            {statusUI.icon}
                                                            {statusUI.label}
                                                        </div>

                                                    
                                                    </div>
                                                </div>

                                                {/* ORDER ITEMS */}
                                                <div className="space-y-4 mb-4">
                                                    {order.items.map((item) => (
                                                        <div
                                                            key={item.order_item_id}
                                                            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
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

                                                                <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                                    <div>
                                                                        <span className="font-medium">Quantity:</span>{" "}
                                                                        {item.quantity}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Unit Price:</span>{" "}
                                                                        ${item.unit_price}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="font-medium text-gray-900 sm:text-right">
                                                                ${item.total_price}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* ORDER META */}
                                                <div className="text-sm text-gray-600 mb-4">
                                                    <span className="font-medium">Items:</span>{" "}
                                                    {order.total_items} <br />
                                                    <span className="font-medium">Payment Status:</span>{" "}
                                                    {order.payment_status}
                                                </div>

                                                {/* Totals */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-700 mb-4">
                                                    <div>
                                                        <span className="font-medium">Cart Total:</span>
                                                        <div>${order.cart_total}</div>
                                                    </div>

                                                    <div>
                                                        <span className="font-medium">Shipping:</span>
                                                        <div>${order.shipping_price}</div>
                                                    </div>

                                                    <div>
                                                        <span className="font-medium">Grand Total:</span>
                                                        <div className="font-semibold text-black">
                                                            ${order.grand_total}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* DEBUG */}
                                                {/* <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
                                                    <pre>
                                                        {JSON.stringify(
                                                            {
                                                                order_status: order.order_status,
                                                                cancel_status: order.cancel_status,
                                                                canCancel,
                                                            },
                                                            null,
                                                            2
                                                        )}
                                                    </pre>
                                                </div> */}
                                                {/* <pre className="text-xs bg-yellow-100 p-2">
                                                    {JSON.stringify(order, null, 2)}
                                                </pre> */}
                                                {/* Actions (still clickable but navigation will happen) */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4">
                                                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">


                                                    

                                                        <Tooltip
                                                            content={
                                                                cancelStatus === "requested"
                                                                    ? "Cancellation request already submitted"
                                                                    : cancelStatus === "approved"
                                                                        ? "Order has been cancelled"
                                                                        : cancelStatus === "rejected"
                                                                            ? "Cancellation request was rejected"
                                                                            : "Cancel this order"
                                                            }
                                                        >
                                                            <button
                                                                disabled={!canCancel}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    openCancelModal(order);
                                                                }}
                                                                className={`w-full sm:w-auto px-4 py-2 text-sm border rounded-md flex items-center gap-2 transition
    ${!canCancel
                                                                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                                                                        : "hover:bg-red-50 text-red-600"
                                                                    }`}
                                                            >
                                                                <FaTimesCircle />
                                                                {cancelStatus === "requested"
                                                                    ? "Cancel Requested"
                                                                    : cancelStatus === "approved"
                                                                        ? "Cancelled"
                                                                        : cancelStatus === "rejected"
                                                                            ? "Cancellation Rejected"
                                                                            : "Cancel Order"}
                                                            </button>
                                                        </Tooltip>

                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleDownloadInvoice(order);
                                                            }}
                                                            className="w-full sm:w-auto px-4 py-2 text-sm border rounded-md flex items-center gap-2 hover:bg-gray-100"
                                                        >
                                                            <FaDownload /> Download Invoice
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        </Link>
                                    );
                                })}


                        </div>


                        {/* Pagination */}
                        <div className="flex flex-wrap justify-center gap-2 pt-6">
                            {/* Prev */}
                            <button
                                onClick={goPrev}
                                disabled={currentPage === 1}
                                className={`px-3 py-2 border rounded-md ${currentPage === 1
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "hover:bg-gray-100"
                                    }`}
                            >
                                <FaChevronLeft />
                            </button>

                            {/* Pages */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                (page) => (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={`px-3 py-2 border rounded-md ${currentPage === page
                                            ? "bg-[#3b82f6] text-white border-[#3b82f6]"
                                            : "hover:bg-gray-100"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                            {/* Next */}
                            <button
                                onClick={goNext}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-2 border rounded-md ${currentPage === totalPages
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "hover:bg-gray-100"
                                    }`}
                            >
                                <FaChevronRight />
                            </button>
                        </div>

                    </div>

                );
            case "wishlist":
                const wishlistItems = []; // later replace with API data

                if (wishlistItems.length === 0) {
                    return (
                        <div className="flex flex-col items-center text-center py-16 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-3xl">
                                <FaHeart />
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900">
                                Your Wishlist is Empty
                            </h3>

                            <p className="text-sm text-gray-500 max-w-md">
                                You haven&apos;t saved any items to your wishlist yet. Start browsing
                                and add items you love!
                            </p>

                            <button className="mt-4 px-6 py-3 bg-[#3b82f6] text-white rounded-md flex items-center gap-2 hover:bg-blue-600 transition">
                                <FaShoppingBag /> Start Shopping
                            </button>
                        </div>
                    );
                }

                return (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistItems.map((item) => (
                            <div
                                key={item.id}
                                className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-40 object-cover rounded-md mb-3"
                                />

                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-500 mb-2">{item.description}</p>

                                <div className="font-semibold mb-3">${item.price}</div>

                                <div className="flex gap-2">
                                    <button className="flex-1 px-3 py-2 text-sm bg-[#3b82f6] text-white rounded-md flex items-center justify-center gap-2">
                                        <FaShoppingCart /> Add to Cart
                                    </button>

                                    <button className="px-3 py-2 border rounded-md text-red-500 hover:bg-red-50">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
                ;

        }
    };

    const openCancelModal = (order) => {
        setSelectedOrder(order);
        setCancelReason("");
        setShowCancelModal(true);
    };

    const submitCancelOrder = async () => {
        if (!cancelReason.trim()) return;

        setCancelSubmitting(true);

        const res = await cancelOrderRequest({
            order_id: selectedOrder.order_id,
            buyer_id: selectedOrder.buyer_id || userId,
            reason: cancelReason,
        });

        setCancelSubmitting(false);

        if (res?.status) {
            setApiMessage(res?.message);
            setApiMessageType("success");

            setOrders((prev) =>
                prev.map((o) =>
                    o.order_id === selectedOrder.order_id
                        ? { ...o, cancel_status: "requested" }
                        : o
                )
            );

            setTimeout(() => {
                setShowCancelModal(false);
                setSelectedOrder(null);
                setApiMessage("");
                setApiMessageType("");
            }, 3000);

        } else {
            setApiMessage(res?.message);
            setApiMessageType("error");

            setTimeout(() => {
                setApiMessage("");
                setApiMessageType("");
            }, 3000);
        }
    };

    const handleCancelOrder = async (order) => {
        const reason = prompt("Enter cancel reason:");

        if (!reason) return;

        setCancelLoadingId(order.order_id);

        const res = await cancelOrderRequest({
            order_id: order.order_id,
            buyer_id: order.buyer_id || userId,
            reason,
        });

        setCancelLoadingId(null);


    };
    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 sm:mb-10">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                    Order History
                </h1>
                <p className="text-sm sm:text-base text-gray-500">
                    View your past purchases, track orders, and manage returns
                </p>
            </div>
            <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 text-sm sm:text-base font-medium transition-all relative
              ${activeTab === tab.id
                                ? "text-[#3b82f6] border-b-2 border-[#3b82f6]"
                                : "text-gray-500 hover:text-[#3b82f6]"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6 border p-4 rounded-xl shadow-md">
                {/* Search Box */}
                <div className="relative w-full md:max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by product name or order ID..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                </div>

                {/* Filters + Export */}
                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="all">All Time</option>
                        <option value="last30">Last 30 Days</option>
                        <option value="last90">Last 90 Days</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white
    focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="all">All Status</option>
                        <option value="placed">Placed</option>
                        <option value="delivered">Delivered</option>
                        <option value="shipped">Shipped</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                        onClick={handleExportOrders}
                        className="flex items-center gap-2 px-4 py-2 border border-black rounded-md text-sm
                     hover:bg-black hover:text-white transition"
                    >
                        <FaDownload className="text-sm" />
                        Export
                    </button>
                </div>
            </div>
            {/* Content */}
            <div className="text-sm sm:text-base text-gray-600">
                {renderContent()}
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-md rounded-xl p-5 shadow-lg">

                        <h2 className="text-lg font-semibold mb-3">
                            Cancel Order #{selectedOrder?.order_number}
                        </h2>

                        <p className="text-sm text-gray-500 mb-3">
                            Please provide reason for cancellation
                        </p>

                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            rows={4}
                            placeholder="Enter reason..."
                        />

                        {apiMessage && (
                            <div
                                className={`mt-3  text-sm ${apiMessageType === "success"
                                    ? " text-green-700 "
                                    : " text-red-700"
                                    }`}
                            >
                                {apiMessage}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="px-4 py-2 text-sm border rounded-md"
                                disabled={cancelSubmitting}
                            >
                                Close
                            </button>

                            <button
                                onClick={submitCancelOrder}
                                disabled={cancelSubmitting || !cancelReason.trim()}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md flex items-center gap-2"
                            >
                                {cancelSubmitting ? "Cancelling..." : "Confirm Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
