// Admin approval status of a property (Properties Request)
export const APPROVAL_STYLES = {
    pending: { label: "Pending Approval", className: "bg-amber-100 text-amber-800" },
    approved: { label: "Approved", className: "bg-green-100 text-green-800" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    changes_requested: { label: "Changes Requested", className: "bg-blue-100 text-blue-800" },
};

export default function ApprovalBadge({ status, className = "" }) {
    const style = APPROVAL_STYLES[status];

    if (!style) return null;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.className} ${className}`}>
            {style.label}
        </span>
    );
}
