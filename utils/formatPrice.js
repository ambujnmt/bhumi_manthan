// ₹1.25 Cr / ₹78.60 Lakh / ₹45,000
export const formatPropertyPrice = (price, emptyText = "Price on Request") => {
  const amount = Number(price);

  if (!price || Number.isNaN(amount) || amount <= 0) return emptyText;
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;

  return `₹${amount.toLocaleString("en-IN")}`;
};

// 0.4 km -> "400 m away", 12.3 -> "12.3 km away"
export const formatDistance = (distanceKm) => {
  const km = Number(distanceKm);

  if (distanceKm === undefined || distanceKm === null || Number.isNaN(km)) return "";
  if (km < 1) return `${Math.max(Math.round(km * 1000), 50)} m away`;

  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
};

// <img onError={imageFallback("/assets/img/prop-1.png")} />
// Broken / missing image -> placeholder (only once, no loop)
export const imageFallback = (fallbackSrc) => (event) => {
  const img = event.currentTarget;

  if (img.dataset.fallback) return;

  img.dataset.fallback = "1";
  img.src = fallbackSrc;
};
