import { useEffect } from "react";
import { useRouter } from "next/router";
import { loginUrl, openLoginPopup } from "../utils/loginPopup";

/**
 * There is no login page any more: login is only the popup (StickyLoginForm, every page).
 * Old /login links, bookmarks and emails open the home page with the popup.
 * With ?next= the user still lands where they were going after login.
 */
export default function LoginRedirect() {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        const next = typeof router.query.next === "string" ? router.query.next : "";

        if (next) {
            router.replace(loginUrl(next));
            return;
        }

        // Plain /login: home, then open the popup (clean URL, no ?login=1 left behind)
        router.replace("/").then(() => {
            if (!openLoginPopup()) setTimeout(openLoginPopup, 500);
        });
    }, [router.isReady, router.query.next, router]);

    return null;
}
