import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PanelRightCloseIcon } from "@hugeicons/core-free-icons";
import Auth from "./pages/auth";
import Home from "./pages/landing/pages/Home";
import Servers from "./pages/user/servers";
import NotFound from "./pages/errors/404";
import Forbidden from "./pages/errors/403";
import AdminOverview from "./pages/admin/overview";
import AdminSoftware from "./pages/admin/software";
import AdminLocations from "./pages/admin/locations";
import AdminPayments from "./pages/admin/Payments";
import AdminConfigs from "./pages/admin/configs";
import AdminCustomization from "./pages/admin/customization";
import ServerOverview from "./pages/user/server/overview";
import ServerFiles from "./pages/user/server/files";
import ServerBackups from "./pages/user/server/backups";
import ServerDatabase from "./pages/user/server/database";
import ServerPlayers from "./pages/user/server/users";
import ServerAccess from "./pages/user/server/access";
import ServerSettings from "./pages/user/server/settings";
import ServerActivity from "./pages/user/server/activity";
import Settings from "./pages/user/Settings";
import Billing from "./pages/user/Billing";
import Invoice from "./pages/user/Invoice";
import Navbar from "./components/navigation/navbar.jsx";
import ServerNav from "./components/navigation/server-nav";
import AdminNav from "./components/navigation/admin-nav";
import Header from "./components/navigation/header";
import GlobalLoader from "./components/loader/global-loader";
import { useAuth } from "./context/auth-context.jsx";
import { CustomizationProvider } from "./context/customization-context.jsx";

const applyCustomization = (config) => {
    if (!config) return;
    const root = document.documentElement;
    const isDark = config.isDark;

    root.style.setProperty('--brand', isDark ? config.brandColorDark : config.brandColor);
    root.style.setProperty('--brand-hover', isDark ? config.brandHoverDark : config.brandHover);
    root.style.setProperty('--surface', isDark ? config.surfaceDark : config.surface);
    root.style.setProperty('--surface-light', isDark ? config.surfaceLightDark : config.surfaceLight);
    root.style.setProperty('--surface-highlight', isDark ? config.surfaceHighlightDark : config.surfaceHighlight);
    root.style.setProperty('--surface-lighter', isDark ? config.surfaceLighterDark : config.surfaceLighter);
    root.style.setProperty('--muted-foreground', isDark ? config.mutedForegroundDark : config.mutedForeground);
    root.style.setProperty('--border-color', isDark ? config.borderColorDark : config.borderColor);
    root.style.setProperty('--border-radius', config.borderRadius);
    root.style.setProperty('--font-family', config.fontFamily);

    if (isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
};

const AppLayout = () => {
  const [showLoader, setShowLoader] = useState(true);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath) {
      setShowLoader(true);
      setPrevPath(location.pathname);
    }
  }, [location.pathname, prevPath]);

  const isServerRoute = location.pathname.startsWith('/app/server');
  const isAdminRoute = location.pathname.startsWith('/app/admin');

  if (isAdminRoute) {
    return (
      <div className="flex h-screen w-full bg-surface-light text-foreground">
        {showLoader && <GlobalLoader onLoadingComplete={() => setShowLoader(false)} />}
        <AdminNav />
        <div className="flex-1 py-2 pr-2">
          <main className="h-full overflow-auto bg-surface rounded-xl shadow-sm flex flex-col">
            <div className="px-4 h-14 flex items-center shrink-0">
              <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer">
                <HugeiconsIcon icon={PanelRightCloseIcon} size={20} />
              </button>
            </div>
            <div className="h-px bg-surface-lighter w-full" />
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-surface-light text-foreground">
      {showLoader && <GlobalLoader onLoadingComplete={() => setShowLoader(false)} />}
      <Navbar />
      <div className="flex-1 py-2 pr-2">
        <main className="h-full overflow-auto bg-surface rounded-xl shadow-sm flex flex-col">
          <div className="px-4 h-14 flex items-center shrink-0">
            <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer">
              <HugeiconsIcon icon={PanelRightCloseIcon} size={20} />
            </button>
          </div>
          <div className="h-px bg-surface-lighter w-full" />
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const RequireAuth = () => {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#18181b" }} />
    );
  }
  if (status === "unauthenticated") return <Navigate to="/" replace />;
  return <Outlet />;
};

const RequireAdmin = () => {
  const { status, isAdmin } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#18181b" }} />
    );
  }
  if (status === "unauthenticated") return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
};

function App() {
  return (
    <CustomizationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/app/home" element={<Servers />} />
              <Route path="/app/billing" element={<Billing />} />
              <Route path="/app/account/settings" element={<Settings />} />
              <Route path="/app/server/:identifier/overview" element={<ServerOverview />} />
              <Route path="/app/server/:identifier/files" element={<ServerFiles />} />
              <Route path="/app/server/:identifier/backups" element={<ServerBackups />} />
              <Route path="/app/server/:identifier/databases" element={<ServerDatabase />} />
              <Route path="/app/server/:identifier/users" element={<ServerPlayers />} />
              <Route path="/app/server/:identifier/access" element={<ServerAccess />} />
              <Route path="/app/server/:identifier/settings" element={<ServerSettings />} />
              <Route path="/app/server/:identifier/activity" element={<ServerActivity />} />

              <Route element={<RequireAdmin />}>
                <Route path="/app/admin/overview" element={<AdminOverview />} />
                <Route path="/app/admin/payments" element={<AdminPayments />} />
                <Route path="/app/admin/software" element={<AdminSoftware />} />
                <Route path="/app/admin/locations" element={<AdminLocations />} />
                <Route path="/app/admin/configs" element={<AdminConfigs />} />
                <Route path="/app/admin/customization" element={<AdminCustomization />} />
              </Route>
            </Route>
            <Route path="/app/billing/invoice/:id" element={<Invoice />} />
          </Route>

          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </CustomizationProvider>
  );
}

export default App;


