import { useState } from "react";
import { FaCheckCircle, FaPhoneAlt, FaUserTie } from "react-icons/fa";
import { BsChatDotsFill } from "react-icons/bs";
import GetNumberModal from "../../Common/GetNumberModal";

// "9876543210" -> "98••••••10" (until the buyer sends a Get Number enquiry)
const maskPhone = (phone) => {
    const value = String(phone || "").trim();

    return value.length > 4 ? `${value.slice(0, 2)}${"•".repeat(value.length - 4)}${value.slice(-2)}` : value;
};

const CREATOR_ROLES = {
    super_admin: "Admin",
    staff: "Staff",
    seller: "Seller",
    broker: "Broker",
};

// Seller / broker of the property, and the user who listed it. Image and phone are optional on a listing.
export default function AgentCard({ property, onChat }) {
    const [imageFailed, setImageFailed] = useState(false);

    // Get Number: phone shown only after the buyer sends an enquiry (lead + OTP),
    // for this page view only - a page refresh hides it again
    const [unlocked, setUnlocked] = useState(false);
    const [getNumberOpen, setGetNumberOpen] = useState(false);

    const creator = property.creator;
    const creatorRole = CREATOR_ROLES[creator?.role];
    const hasAgent = Boolean(property.agent_name);
    const name = property.agent_name || creator?.name;

    const creatorBadges = creator && (
        <>
            {creatorRole && (
                <span className="rounded-full bg-[#FFECD3] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-color)]">
                    {creatorRole}
                </span>
            )}
            {creator.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                    <FaCheckCircle size={10} aria-hidden="true" /> Verified
                </span>
            )}
        </>
    );
    const details = [property.agent_type, property.agent_experience && `${property.agent_experience} experience`]
        .filter(Boolean)
        .join(" · ");

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
                {property.agent_image && !imageFailed ? (
                    <img
                        src={property.agent_image}
                        alt={name}
                        onError={() => setImageFailed(true)}
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFECD3] text-[var(--primary-color)]" aria-hidden="true">
                        <FaUserTie size={28} />
                    </span>
                )}

                <div className="min-w-0">
                    {name && (
                        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-bold text-[var(--secondary-color)]">
                            <span className="break-words">{name}</span>
                            {!hasAgent && creatorBadges}
                            {hasAgent && property.agent_verified && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                                    <FaCheckCircle size={10} aria-hidden="true" /> Verified
                                </span>
                            )}
                        </div>
                    )}
                    {details && <p className="mb-1 text-[13px] text-[#62748E]">{details}</p>}
                    {property.agent_phone && (
                        unlocked ? (
                            <a href={`tel:${property.agent_phone}`} className="text-sm font-semibold text-[var(--secondary-color)] no-underline hover:text-[var(--primary-color)]">
                                {property.agent_phone}
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setGetNumberOpen(true)}
                                title="Get the number"
                                className="font-mono text-sm font-semibold tracking-wide text-[var(--secondary-color)] hover:text-[var(--primary-color)]"
                            >
                                {maskPhone(property.agent_phone)}
                            </button>
                        )
                    )}
                    {hasAgent && creator && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-gray-100 pt-2 text-[13px] text-[#62748E]">
                            <span>Listed by</span>
                            <span className="break-words font-semibold text-[var(--secondary-color)]">{creator.name}</span>
                            {creatorBadges}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 gap-2">
                <button
                    type="button"
                    onClick={onChat}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--primary-color)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--secondary-color)] sm:flex-none"
                >
                    <BsChatDotsFill size={14} aria-hidden="true" /> Chat
                </button>
                {property.agent_phone && (
                    unlocked ? (
                        <a
                            href={`tel:${property.agent_phone}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--primary-color)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-color)] no-underline transition-colors hover:bg-[var(--primary-color)] hover:text-white sm:flex-none"
                        >
                            <FaPhoneAlt size={12} aria-hidden="true" /> Call
                        </a>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setGetNumberOpen(true)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--primary-color)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-color)] transition-colors hover:bg-[var(--primary-color)] hover:text-white sm:flex-none"
                        >
                            <FaPhoneAlt size={12} aria-hidden="true" /> Get Number
                        </button>
                    )
                )}
            </div>

            {/* Get Number enquiry (lead to the seller / broker who listed it) */}
            <GetNumberModal
                open={getNumberOpen}
                agentId={creator?.id}
                agentName={name}
                phone={property.agent_phone}
                defaultMessage={property.title ? `I am interested in "${property.title}". Please share the details.` : ""}
                onClose={() => setGetNumberOpen(false)}
                onUnlocked={() => setUnlocked(true)}
            />
        </div>
    );
}
