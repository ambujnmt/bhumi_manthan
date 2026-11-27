import { useState } from "react";
import { Spinner } from "@heroui/react";
import { FiBriefcase, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
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
];

// Multiple RERA numbers (Add More), same limit as the backend
const MAX_RERA = 10;

// Seller / broker: their properties show to buyers within this many km (empty = default 50 km)
const MAX_RADIUS_KM = 5000;
const hasRadius = (profile) => ["seller", "broker"].includes(profile?.role);
const radiusFrom = (profile) => (profile?.service_radius_km ? String(profile.service_radius_km) : "");

const PIN_PATTERN = /^[0-9]{4,10}$/;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#1A1F36] outline-none transition focus:border-[#E87722] focus:ring-2 focus:ring-orange-100";

const labelClass = "mb-0 block text-xs font-medium uppercase tracking-wide text-gray-400";

const formFrom = (profile) => Object.fromEntries(FIELDS.map(({ name }) => [name, profile?.[name] || ""]));

// Saved RERA list (old accounts only have rera_number)
const savedRera = (profile) => {
  if (Array.isArray(profile?.rera_numbers) && profile.rera_numbers.length) {
    return profile.rera_numbers.filter(Boolean);
  }
  return profile?.rera_number ? [profile.rera_number] : [];
};

// Edit form always shows at least one input
const reraFormFrom = (profile) => {
  const list = savedRera(profile);
  return list.length ? [...list] : [""];
};

/**
 * Address + business details of a seller / broker (Address, City, State, Country,
 * PIN Code, Broker/Agency Name, RERA Numbers with Add More) with Edit -> POST /api/profile/update.
 *
 * onSaved(user): fresh user from the API (page state + UserContext)
 */
export default function BusinessDetailsCard({ profile, onSaved, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => formFrom(profile));
  const [reraNumbers, setReraNumbers] = useState(() => reraFormFrom(profile));
  const [radius, setRadius] = useState(() => radiusFrom(profile));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const reraList = savedRera(profile);

  const startEditing = () => {
    setForm(formFrom(profile));
    setReraNumbers(reraFormFrom(profile));
    setRadius(radiusFrom(profile));
    setErrors({});
    setEditing(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: name === "pin_code" ? value.replace(/\D/g, "") : value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const clearReraErrors = () =>
    setErrors((previous) =>
      Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith("rera_numbers")))
    );

  const handleReraChange = (index, value) => {
    setReraNumbers((previous) => previous.map((item, i) => (i === index ? value.toUpperCase() : item)));
    clearReraErrors();
  };

  const addRera = () => {
    setReraNumbers((previous) => (previous.length >= MAX_RERA ? previous : [...previous, ""]));
  };

  const removeRera = (index) => {
    setReraNumbers((previous) => (previous.length > 1 ? previous.filter((_, i) => i !== index) : [""]));
    clearReraErrors();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));

    if (payload.pin_code && !PIN_PATTERN.test(payload.pin_code)) {
      setErrors({ pin_code: "PIN code must be 4 to 10 digits." });
      return;
    }

    const cleanedRera = reraNumbers.map((value) => value.trim()).filter(Boolean);
    const duplicate = cleanedRera.find((value, i) => cleanedRera.indexOf(value) !== i);

    if (duplicate) {
      setErrors({ rera_numbers: `RERA number "${duplicate}" is added more than once.` });
      return;
    }

    payload.rera_numbers = cleanedRera;

    // Radius: whole km 1 - 5000, empty = default 50 km (null)
    if (hasRadius(profile)) {
      const km = radius.trim();

      if (km && (!/^\d+$/.test(km) || Number(km) < 1 || Number(km) > MAX_RADIUS_KM)) {
        setErrors({ service_radius_km: `Enter a radius from 1 to ${MAX_RADIUS_KM} km, or leave it empty for the default 50 km.` });
        return;
      }

      payload.service_radius_km = km ? Number(km) : null;
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

          {/* RERA numbers: one or more, with Add More */}
          <div className="sm:col-span-2">
            <label htmlFor="business_rera_0" className={labelClass}>
              RERA Number{reraNumbers.length > 1 ? "s" : ""}
            </label>

            <div className="space-y-1">
              {reraNumbers.map((value, index) => (
                <div key={index}>
                  <div className="flex items-start gap-2">
                    <input
                      id={`business_rera_${index}`}
                      value={value}
                      onChange={(event) => handleReraChange(index, event.target.value)}
                      maxLength={100}
                      placeholder="e.g. UPRERAAGT12345"
                      aria-label={`RERA Number ${index + 1}`}
                      aria-invalid={Boolean(errors[`rera_numbers.${index}`])}
                      className={inputClass}
                    />
                    {(reraNumbers.length > 1 || value) && (
                      <button
                        type="button"
                        onClick={() => removeRera(index)}
                        aria-label={`Remove RERA Number ${index + 1}`}
                        title="Remove"
                        className="mt-1.5 flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    )}
                  </div>
                  {errors[`rera_numbers.${index}`] && (
                    <p className="mb-0 mt-1 text-xs text-red-600">{errors[`rera_numbers.${index}`]}</p>
                  )}
                </div>
              ))}
            </div>

            {errors.rera_numbers && <p className="mb-0 mt-1 text-xs text-red-600">{errors.rera_numbers}</p>}

            {reraNumbers.length < MAX_RERA && (
              <button
                type="button"
                onClick={addRera}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#E87722] px-3 py-1.5 text-xs font-semibold text-[#E87722] transition hover:bg-orange-50"
              >
                <FiPlus size={14} />
                Add More
              </button>
            )}
          </div>

          {/* Seller / broker: how far their properties show to buyers */}
          {hasRadius(profile) && (
            <div className="sm:col-span-2">
              <label htmlFor="business_service_radius_km" className={labelClass}>
                Property Radius (km)
              </label>
              <div className="relative sm:max-w-xs">
                <input
                  id="business_service_radius_km"
                  value={radius}
                  onChange={(event) => {
                    setRadius(event.target.value.replace(/\D/g, "").slice(0, 4));
                    setErrors((previous) => ({ ...previous, service_radius_km: undefined }));
                  }}
                  inputMode="numeric"
                  placeholder="50 (default)"
                  aria-invalid={Boolean(errors.service_radius_km)}
                  aria-describedby="business_service_radius_km_help"
                  className={`${inputClass} pr-12`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-sm text-gray-400">km</span>
              </div>
              <p id="business_service_radius_km_help" className="mb-0 mt-1 text-xs text-gray-400">
                Buyers see your properties only when they are within this distance of the property. Leave empty for the default 50 km.
              </p>
              {errors.service_radius_km && <p className="mb-0 mt-1 text-xs text-red-600">{errors.service_radius_km}</p>}
            </div>
          )}

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

          {hasRadius(profile) && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Property Radius</p>
              <p className="mb-0 text-sm font-semibold text-gray-800">
                {profile?.service_radius_km ? `${profile.service_radius_km} km` : "50 km (default)"}
              </p>
            </div>
          )}

          {/* RERA numbers as chips */}
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
              RERA Number{reraList.length > 1 ? "s" : ""}
            </p>
            {reraList.length ? (
              <div className="flex flex-wrap gap-2">
                {reraList.map((rera) => (
                  <span
                    key={rera}
                    className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-[#E87722]"
                  >
                    {rera}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mb-0 text-sm font-semibold text-gray-800">-</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
