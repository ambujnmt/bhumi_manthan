// "2026-11-05" -> local Date (no timezone shift)
export const parseEventDate = (value) => {
    if (!value) return null;

    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
};

// 05 Nov 2026
export const formatEventDate = (value, options = { day: "2-digit", month: "short", year: "numeric" }) => {
    const date = parseEventDate(value);

    return date ? date.toLocaleDateString("en-IN", options) : "";
};

// "18:30:00" -> 06:30 pm
export const formatEventTime = (value) => {
    if (!value) return "";

    const [hours, minutes] = value.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

// Last day of the event (single-day events have no / same end date)
const lastDay = (event) => event?.end_date || event?.event_date;

const isMultiDay = (event) =>
    Boolean(event?.end_date) && String(event.end_date).slice(0, 10) !== String(event.event_date).slice(0, 10);

// Date badge parts: { days: "15 - 16", month: "Nov 2025" }
export const dateBadge = (event) => {
    const start = parseEventDate(event?.event_date);
    const end = parseEventDate(lastDay(event));

    if (!start) return { days: "--", month: "" };

    const day = (date) => date.toLocaleDateString("en-IN", { day: "2-digit" });
    const month = (date) => date.toLocaleDateString("en-IN", { month: "short" });
    const sameMonth = end && end.getMonth() === start.getMonth() && end.getFullYear() === start.getFullYear();

    if (!isMultiDay(event) || !end) {
        return { days: day(start), month: `${month(start)} ${start.getFullYear()}` };
    }

    return sameMonth
        ? { days: `${day(start)} - ${day(end)}`, month: `${month(start)} ${start.getFullYear()}` }
        : { days: `${day(start)} ${month(start)} -`, month: `${day(end)} ${month(end)} ${end.getFullYear()}` };
};

// "15 Nov 2025" or "15 - 16 Nov 2025" (options = weekday etc. for single day)
export const formatEventDateRange = (event, options) => {
    if (!isMultiDay(event)) return formatEventDate(event?.event_date, options);

    const { days, month } = dateBadge(event);

    return `${days} ${month}`;
};

// Event is upcoming until its last day is over (today counts as upcoming)
export const isUpcomingEvent = (event) => {
    const date = parseEventDate(lastDay(event));
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return Boolean(date) && date >= today;
};

// Current date + time in India (event times are IST, visitor may be anywhere)
const indiaNow = (now = Date.now()) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(now));

    const get = (type) => parts.find((part) => part.type === type)?.value;

    return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
};

/**
 * Event is LIVE: today is one of its days and the time is between start and end time.
 * No start time -> from 00:00, no end time -> till 23:59. End before start (18:00 - 02:00) = runs past midnight.
 */
export const isEventLive = (event, now = Date.now()) => {
    if (!event?.event_date) return false;

    const { date, time } = indiaNow(now);
    const first = String(event.event_date).slice(0, 10);
    const last = String(lastDay(event)).slice(0, 10);
    const start = String(event.start_time || "00:00").slice(0, 5);
    const end = String(event.end_time || "23:59").slice(0, 5);

    if (end > start) {
        return date >= first && date <= last && time >= start && time <= end;
    }

    // Overnight: started this evening, or still running after midnight from yesterday
    const yesterday = indiaNow(now - 86400000).date;

    return (date >= first && date <= last && time >= start) || (yesterday >= first && yesterday <= last && time <= end);
};

// Upcoming: soonest first, past: latest first
export const splitEvents = (events = []) => {
    const byDate = (a, b) =>
        (parseEventDate(a.event_date)?.getTime() ?? 0) - (parseEventDate(b.event_date)?.getTime() ?? 0);

    return {
        upcoming: events.filter(isUpcomingEvent).sort(byDate),
        past: events.filter((event) => !isUpcomingEvent(event)).sort((a, b) => byDate(b, a)),
    };
};

// "Noida, Uttar Pradesh"
export const eventCityState = (event) => [event?.city, event?.state].filter(Boolean).join(", ");

// Venue line for cards: "Taj Convention Center, Noida"
export const eventVenue = (event) => [event?.location, event?.city].filter(Boolean).join(", ");

// Google Calendar "add event" link
export const googleCalendarUrl = (event) => {
    const day = (value) => String(value || "").slice(0, 10).replace(/-/g, "");
    const time = (value) => String(value || "00:00:00").slice(0, 8).replace(/:/g, "");

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event?.title || "Event",
        dates: `${day(event?.event_date)}T${time(event?.start_time)}/${day(lastDay(event))}T${time(event?.end_time)}`,
        details: event?.description || "",
        location: [event?.location, event?.address].filter(Boolean).join(", "),
        ctz: "Asia/Kolkata",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Organiser's map link, else a Google Maps search of the venue
export const mapUrl = (event) =>
    event?.map_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [event?.location, event?.address, event?.city].filter(Boolean).join(", ")
    )}`;
