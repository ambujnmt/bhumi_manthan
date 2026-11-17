# Appointments module (React)

Booking button with calendar and slot picker, plus the owner / admin screen. The API is in `backend/app/Modules/Appointments`.

## Add it to another project

1. Copy this folder to `modules/appointments`.
2. Edit `config.js` (API base URL and how to read the login token).
3. Add `"./modules/**/*.{js,jsx}"` to `content` in `tailwind.config.js`.
4. Define the colours `--primary-color` and `--secondary-color` in your global CSS.

Needs React, Tailwind, `react-icons` and `js-cookie`.

## Use it

```jsx
import { BookAppointmentButton, AppointmentManager } from "@/modules/appointments";

// bookableType must exist in the backend config "appointments.bookables"
// Booking needs login: without a user the button calls onLoginRequired.
<BookAppointmentButton
  bookableType="property"
  bookableKey={property.slug}
  title={property.title}
  user={user}
  onLoginRequired={() => router.push("/login")}
/>

// Inside your own protected admin page. getBookableUrl is optional.
<AppointmentManager getBookableUrl={(item) => `/web/propertyDetail/${item.bookable_id}`} />
```
