// "Added By" cell for admin listings (properties / projects - created_by user)
const ROLE_STYLES = {
    super_admin: "bg-[#001737] text-white",
    staff: "bg-blue-50 text-blue-700",
    seller: "bg-green-50 text-green-700",
    broker: "bg-orange-50 text-[#E87722]",
};

export default function AddedBy({ creator }) {
    if (!creator) {
        return <span className="text-xs text-gray-400">-</span>;
    }

    return (
        <div className="flex items-center gap-2" title={creator.email || ""}>
            {/* First letter avatar */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold uppercase text-[#E87722]">
                {(creator.name || creator.email || "?").trim().charAt(0)}
            </span>

            <div className="min-w-0 leading-tight">
                <p className="mb-0 max-w-[140px] truncate text-sm font-medium text-[#1A1F36]">{creator.name || "-"}</p>
                <span
                    className={`mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-semibold capitalize ${
                        ROLE_STYLES[creator.role] || "bg-gray-100 text-gray-600"
                    }`}
                >
                    {creator.role === "super_admin" ? "Admin" : creator.role}
                </span>
            </div>
        </div>
    );
}
