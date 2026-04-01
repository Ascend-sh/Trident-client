import { createContext, useContext, useState, useEffect } from "react";

const CustomizationContext = createContext();

export const CustomizationProvider = ({ children }) => {
    const [customization, setCustomization] = useState({
        siteName: "Torqen",
        logoUrl: "/Logo-dark.png",
        brandColor: "#18181b",
        brandColorDark: "#ffffff",
        brandHover: "#27272a",
        brandHoverDark: "#f4f4f5",
        surface: "#ffffff",
        surfaceDark: "#121212",
        surfaceLight: "#f4f4f5",
        surfaceLightDark: "#18181b",
        surfaceHighlight: "#e5e5e5",
        surfaceHighlightDark: "#27272a",
        surfaceLighter: "#e4e4e7",
        surfaceLighterDark: "#3f3f46",
        mutedForeground: "#71717a",
        mutedForegroundDark: "#a1a1aa",
        foreground: "#18181b",
        foregroundDark: "#ffffff",
        borderColor: "#e4e4e7",

        borderColorDark: "#3f3f46",
        borderRadius: "0.625rem",
        fontFamily: "'Satoshi', sans-serif",
        isCompact: true,
        isDark: true
    });

    const applyCustomization = (config) => {
        if (!config) return;
        const root = document.documentElement;

        // Set Light Mode Variables
        root.style.setProperty('--brand-l', config.brandColor);
        root.style.setProperty('--brand-hover-l', config.brandHover);
        root.style.setProperty('--surface-l', config.surface);
        root.style.setProperty('--surface-light-l', config.surfaceLight);
        root.style.setProperty('--surface-highlight-l', config.surfaceHighlight);
        root.style.setProperty('--surface-lighter-l', config.surfaceLighter);
        root.style.setProperty('--muted-foreground-l', config.mutedForeground);
        root.style.setProperty('--foreground-l', config.foreground);
        root.style.setProperty('--border-color-l', config.borderColor);


        // Set Dark Mode Variables
        root.style.setProperty('--brand-d', config.brandColorDark);
        root.style.setProperty('--brand-hover-d', config.brandHoverDark);
        root.style.setProperty('--surface-d', config.surfaceDark);
        root.style.setProperty('--surface-light-d', config.surfaceLightDark);
        root.style.setProperty('--surface-highlight-d', config.surfaceHighlightDark);
        root.style.setProperty('--surface-lighter-d', config.surfaceLighterDark);
        root.style.setProperty('--muted-foreground-d', config.mutedForegroundDark);
        root.style.setProperty('--foreground-d', config.foregroundDark);
        root.style.setProperty('--border-color-d', config.borderColorDark);


        // Common Variables
        root.style.setProperty('--border-radius', config.borderRadius);
        root.style.setProperty('--font-family', config.fontFamily);

        // Enforce theme only if "Dark Persistence" (isDark) is enabled
        if (config.isDark) {
            root.classList.add('dark');
        } else {
            // When persistence is off, we don't force 'dark' or 'light'.
            // This allows the useTheme hook (localStorage) to maintain user preference.
            // If the user has never toggled, it defaults to light via index.css mapping.
        }
    };

    useEffect(() => {
        if (customization.siteName) {
            document.title = customization.siteName;
        }
    }, [customization.siteName]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/v1/client/site-settings');
                const data = await response.json();
                if (data.customization) {
                    setCustomization(data.customization);
                    applyCustomization(data.customization);
                }
            } catch (error) {
                console.error("Failed to fetch site settings:", error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <CustomizationContext.Provider value={customization}>
            {children}
        </CustomizationContext.Provider>
    );
};

export const useCustomization = () => {
    const context = useContext(CustomizationContext);
    if (!context) {
        throw new Error("useCustomization must be used within a CustomizationProvider");
    }
    return context;
};
