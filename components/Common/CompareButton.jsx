import { useState } from "react";
import NextLink from "next/link";
import { MdCompareArrows } from "react-icons/md";
import { useCompare } from "../../context/CompareContext";

export default function CompareButton({ propertyId }) {
  const { ids, toggleCompare } = useCompare();
  const [saving, setSaving] = useState(false);
  const added = ids.includes(propertyId);

  const handleClick = async () => {
    setSaving(true);
    await toggleCompare(propertyId);
    setSaving(false);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        aria-pressed={added}
        disabled={saving}
        onClick={handleClick}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          added
            ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white hover:bg-[var(--secondary-color)]"
            : "border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[#FFECD3]"
        }`}
      >
        <MdCompareArrows size={18} aria-hidden="true" />
        {added ? "Remove from Compare" : "Add to Compare"}
      </button>

      {added && (
        <NextLink href="/web/compare" className="text-sm font-semibold text-[var(--primary-color)] underline">
          View Compare List
        </NextLink>
      )}
    </div>
  );
}
