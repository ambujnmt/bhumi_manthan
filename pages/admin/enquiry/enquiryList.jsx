import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "../../../context/UserContext";
import { toRolePath } from "../../../utils/adminPermissions";

/**
 * Property Enquiries page was removed: property / project enquiries are saved as Leads.
 * Old links and bookmarks open the Leads page instead.
 */
export default function PropertyEnquiriesRedirect() {
    const router = useRouter();
    const { user } = useUser();

    useEffect(() => {
        router.replace(toRolePath(user, "/admin/lead/leadList"));
    }, [router, user]);

    return null;
}
