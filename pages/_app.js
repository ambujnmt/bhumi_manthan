import { HeroUIProvider } from "@heroui/system";
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { UserProvider, useUser } from "../context/UserContext";
import { WishlistProvider } from "../context/WishlistContext";
import { CompareProvider } from "../context/CompareContext";
import { GoogleOAuthProvider } from '@react-oauth/google'; // ✅ Import GoogleOAuthProvider
import { RegisteredUserProvider } from "../context/RegisteredUserContext"; // ✅ Import RegisteredUserProvider
import { toRolePath } from "../utils/adminPermissions";
import useScrollRestoration from "../utils/useScrollRestoration";
import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Toast from "../components/Toast";


const Snackbar = dynamic(() => import('@/components/utils/Snackbar'), { ssr: false });

/**
 * Admin panel URL by logged in role:
 * /admin/... (super admin), /seller/..., /broker/..., /staff/...
 * - HeroUI <Link> navigates straight to the role URL
 * - any other link / redirect to a wrong prefix is replaced with the role URL
 */
function RoleAwareProviders({ children }) {
  const router = useRouter();
  const { user, authLoading } = useUser();

  useEffect(() => {
    if (authLoading || !user || !router.isReady) return;

    const rolePath = toRolePath(user, router.asPath);

    if (rolePath !== router.asPath) {
      router.replace(rolePath);
    }
  }, [authLoading, user, router.isReady, router.asPath]);

  return (
    <HeroUIProvider navigate={(path) => router.push(toRolePath(user, path))}>
      {children}
    </HeroUIProvider>
  );
}

function App({ Component, pageProps, websiteData }) {
  const getLayout = Component.getLayout || ((page) => page);

  const router = useRouter();

  // Back / forward returns to the same scroll position (not the top of the page)
  useScrollRestoration(router);

  // Dashboard panels (admin / seller / broker / user): body class for panel-only CSS
  // (globals.css removes Bootstrap's link underline there)
  useEffect(() => {
    const isPanel = /^\/(admin|seller|broker|staff|user)(\/|$)/.test(router.pathname);
    document.body.classList.toggle("dashboard-panel", isPanel);
  }, [router.pathname]);


  return (
      <LanguageProvider>
        <UserProvider>
          <RegisteredUserProvider>
            <WishlistProvider>
            <CompareProvider>
            <RoleAwareProviders>
              <DefaultLayout websiteData={websiteData}>
                 <Toast />
              {getLayout(<Component {...pageProps} />)}
              </DefaultLayout>
              <Snackbar />
            </RoleAwareProviders>
            </CompareProvider>
            </WishlistProvider>
          </RegisteredUserProvider>
        </UserProvider>
      </LanguageProvider>
  );
}


export default App;
