import { useState } from "react";
import { Spinner } from "@heroui/react";
import { FiBriefcase, FiEdit2 } from "react-icons/fi";
import { updateProfile } from "../../utils/fetchApi";
import { showToast } from "../../store/toast";

// Seller / broker profile fields (backend users table). full = whole row in the grid.
const FIELDS = [
  { name: "address", label: "Address", maxLength: 500, full: true, placeholder: "House / office no., street, area", autoComplete: "street-address" },
  { name: "city", label: "City", maxLength: 100, placeholder: "e.g. Noida", autoComplete: "address-level2" },
  { name: "state", label: "State", maxLength: 100, placeholder: "e.g. Uttar Pradesh", autoComplete: "address-level1" },
  { name: "country", label: "Country", maxLength: 100, placeholder: "e.g. India", autoComplete: "country-name" },
  { name: "pin_code", label: "PIN Code", maxLength: 10, placeholder: "e.g. 201301", inputMode: "numeric", autoComplete: "postal-code" },
  { name: "agency_name", label: "Broker/Agency Name", maxLength: 255, placeholder: "Your firm / agency name", autoComplete: "organization" },
  { name: "rera_number", label: "RERA Number", maxLength: 100, placeholder: "e.g. UPRERAAGT12345" },
];

const PIN_PATTERN = /^[0-9]{4,10}$/;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "mb-0 block text-xs font-medium uppercase tracking-wide text-gray-400";

const formFrom = (profile) => Object.fromEntries(FIELDS.map(({ name }) => [name, profile?.[name] || ""]));

/**
 * Address + business details of a seller / broker (Address, City, State, Country,
 * PIN Code, Broker/Agency Name, RERA Number) with Edit -> POST /api/profile/update.
 *
 * onSaved(user): fresh user from the API (page state + UserContext)
 */
export default function BusinessDetailsCard({ profile, onSaved, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => formFrom(profile));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setForm(formFrom(profile));
    setErrors({});
    setEditing(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: name === "pin_code" ? value.replace(/\D/g, "") : value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));

    if (payload.pin_code && !PIN_PATTERN.test(payload.pin_code)) {
      setErrors({ pin_code: "PIN code must be 4 to 10 digits." });
      return;
    }

    setSaving(true);

    try {
      const res = await updateProfile(payload);
      showToast(res?.message || "Profile updated successfully.");
      onSaved?.(res?.data?.user);
      setEditing(false);
    } catch (error) {
      setErrors(
        Object.fromEntries(Object.entries(error?.errors || {}).map(([key, messages]) => [key, [].concat(messages)[0]]))
      );
      showToast(error?.message || "Unable to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-7">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
          <FiBriefcase className="h-[18px] w-[18px] text-[#E87722]" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-0 text-sm font-bold text-[#001737] sm:text-base">
            {editing ? "Edit Business & Address Details" : "Business & Address Details"}
          </h3>
          <p className="mb-0 text-xs text-gray-400">Address, agency and RERA registration</p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#E87722] px-3 py-1.5 text-xs font-semibold text-[#E87722] transition hover:bg-[#E87722] hover:text-white"
          >
            <FiEdit2 size={13} />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
          {FIELDS.map(({ name, label, full, ...input }) => (
            <div key={name} className={full ? "sm:col-span-2" : ""}>
              <label htmlFor={`business_${name}`} className={labelClass}>
                {label}
              </label>
              <input
                id={`business_${name}`}
                name={name}
                value={form[name]}
                onChange={handleChange}
                className={inputClass}
                aria-invalid={Boolean(errors[name])}
                {...input}
              />
              {errors[name] && <p className="mb-0 mt-1 text-xs text-red-600">{errors[name]}</p>}
            </div>
          ))}

          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-[#001737] transition hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#E87722] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d96818] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Spinner size="sm" color="white" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
          {FIELDS.map(({ name, label, full }) => (
            <div key={name} className={full ? "sm:col-span-2 lg:col-span-3" : ""}>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
              <p className="mb-0 break-words text-sm font-semibold text-gray-800">{profile?.[name] || "-"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
