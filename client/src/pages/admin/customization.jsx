import { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, ArrowDown01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

export default function AdminCustomization() {
    const [config, setConfig] = useState({
        siteName: "Torqen Cloud",
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

    const [originalConfig, setOriginalConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const presetMenuRef = useRef(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/v1/client/admin/customization');
                const data = await response.json();
                if (data.customization) {
                    setConfig(data.customization);
                    setOriginalConfig(data.customization);
                }
            } catch (error) {
                console.error("Failed to fetch customization:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (presetMenuRef.current && !presetMenuRef.current.contains(event.target)) {
                setIsPresetMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const hasChanges = originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            const response = await fetch('/api/v1/client/admin/customization', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await response.json();
            if (data.ok) {
                setOriginalConfig(config);
            }
        } catch (error) {
            console.error("Failed to save customization:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateConfig = (key, value) => {
        if (key === 'brandColor') {
            setConfig(prev => ({
                ...prev,
                brandColor: value,
                brandColorDark: value,
                brandHover: value,
                brandHoverDark: value
            }));
            return;
        }
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleToggle = async (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        try {
            const response = await fetch('/api/v1/client/admin/customization', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            const data = await response.json();
            if (data.ok) {
                setOriginalConfig(newConfig);
            }
        } catch (error) {
            console.error(`Failed to auto-save ${key}:`, error);
        }
    };

    const colorPresets = [
        { name: "Obsidian", value: config.isDark ? "#ffffff" : "#000000" },
        { name: "Ruby", value: "#FB2C36" },
        { name: "Amber", value: "#FF6900" },
        { name: "Gold", value: "#FDC700" },
        { name: "Lime", value: "#9AE600" },
        { name: "Sky", value: "#00BCFF" },
        { name: "Lavender", value: "#7C86FF" },
    ];

    const themeTemplates = [
        {
            name: "Neutral",
            description: "Default platform aesthetic",
            config: {
                brandColor: "#18181b", brandColorDark: "#ffffff", brandHover: "#27272a", brandHoverDark: "#f4f4f5",
                surface: "#ffffff", surfaceDark: "#121212", surfaceLight: "#f4f4f5", surfaceLightDark: "#18181b",
                surfaceHighlight: "#e5e5e5", surfaceHighlightDark: "#27272a", surfaceLighter: "#e4e4e7", surfaceLighterDark: "#3f3f46",
                mutedForeground: "#71717a", mutedForegroundDark: "#a1a1aa", foreground: "#18181b", foregroundDark: "#ffffff",
                borderColor: "#e4e4e7", borderColorDark: "#3f3f46", borderRadius: "0.625rem", fontFamily: "'Satoshi', sans-serif",
                isCompact: true, isDark: true
            }
        },
        {
            name: "Signature",
            description: "Platform brand identity",
            config: {
                brandColor: "#b0f97d", brandColorDark: "#b0f97d", brandHover: "#a0f06d", brandHoverDark: "#a0f06d",
                surface: "#ffffff", surfaceDark: "#121212", surfaceLight: "#f4f4f5", surfaceLightDark: "#18181b",
                surfaceHighlight: "#e5e5e5", surfaceHighlightDark: "#27272a", surfaceLighter: "#e4e4e7", surfaceLighterDark: "#3f3f46",
                mutedForeground: "#71717a", mutedForegroundDark: "#a1a1aa", foreground: "#18181b", foregroundDark: "#ffffff",
                borderColor: "#e4e4e7", borderColorDark: "#3f3f46", borderRadius: "0.625rem", fontFamily: "'Satoshi', sans-serif",
                isCompact: true, isDark: true
            }
        },
        { name: "Oceanic", description: "Professional cobalt", config: { brandColor: "#1e40af", isCompact: false, isDark: true } },
        { name: "Cyberpunk", description: "Neon violet energy", config: { brandColor: "#7c3aed", isCompact: true, isDark: true } },
        { name: "Forest", description: "Organic emerald shades", config: { brandColor: "#065f46", isCompact: false, isDark: true } },
        { name: "Ruby", description: "Sleek crimson accent", config: { brandColor: "#991b1b", isCompact: true, isDark: true } },
        { name: "Clean", description: "Standard slate light", config: { brandColor: "#475569", isCompact: false, isDark: false } },
        { name: "Carbon", description: "Matte grey professional", config: { brandColor: "#27272a", isCompact: true, isDark: true } }
    ];

    const currentTemplate = themeTemplates.find(t =>
        t.config.brandColor === config.brandColor && t.config.isCompact === config.isCompact
    );

    const applyTemplate = (template) => {
        setConfig(prev => ({ ...prev, ...template.config }));
        setIsPresetMenuOpen(false);
    };

    const advancedColors = [
        { label: "Brand Color", key: "brandColor" },
        { label: "Brand Color Dark", key: "brandColorDark" },
        { label: "Brand Hover", key: "brandHover" },
        { label: "Brand Hover Dark", key: "brandHoverDark" },
        { label: "Surface", key: "surface" },
        { label: "Surface Dark", key: "surfaceDark" },
        { label: "Surface Light", key: "surfaceLight" },
        { label: "Surface Light Dark", key: "surfaceLightDark" },
        { label: "Surface Highlight", key: "surfaceHighlight" },
        { label: "Surface Highlight Dark", key: "surfaceHighlightDark" },
        { label: "Surface Lighter", key: "surfaceLighter" },
        { label: "Surface Lighter Dark", key: "surfaceLighterDark" },
        { label: "Muted Foreground", key: "mutedForeground" },
        { label: "Muted Foreground Dark", key: "mutedForegroundDark" },
        { label: "Document Text", key: "foreground" },
        { label: "Document Text Dark", key: "foregroundDark" },
        { label: "Border Color", key: "borderColor" },
        { label: "Border Color Dark", key: "borderColorDark" },
    ];

    if (isLoading) {
        return (
            <div className="bg-surface px-10 py-10 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-brand/10 border-t-brand animate-spin" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface px-10 py-10 min-h-screen">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Customization</h1>
                    <p className="text-[13px] font-bold text-muted-foreground mt-2">Configure your platform's appearance and branding</p>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-3 h-3 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                                Saving
                            </>
                        ) : (
                            <>
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                                Save Changes
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Identity */}
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-0.5">Identity</p>
                        <div className="border border-surface-lighter rounded-lg divide-y divide-surface-lighter">
                            <div className="px-5 py-4 flex items-center justify-between gap-6">
                                <div className="shrink-0">
                                    <p className="text-[12px] font-bold text-foreground mb-0.5">Site Name</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Displayed across the platform</p>
                                </div>
                                <input
                                    type="text"
                                    value={config.siteName}
                                    onChange={(e) => updateConfig('siteName', e.target.value)}
                                    className="h-8 px-3 bg-surface-light border border-surface-lighter rounded-md text-[12px] font-bold text-foreground focus:outline-none focus:border-brand/20 transition-all w-[220px] text-right"
                                />
                            </div>
                            <div className="px-5 py-4 flex items-center justify-between gap-6">
                                <div className="shrink-0">
                                    <p className="text-[12px] font-bold text-foreground mb-0.5">Logo Path</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Resource URL for the logo asset</p>
                                </div>
                                <input
                                    type="text"
                                    value={config.logoUrl}
                                    onChange={(e) => updateConfig('logoUrl', e.target.value)}
                                    className="h-8 px-3 bg-surface-light border border-surface-lighter rounded-md text-[11px] font-bold text-foreground font-mono focus:outline-none focus:border-brand/20 transition-all w-[220px] text-right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Theme Preset */}
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-0.5">Theme</p>
                        <div className="border border-surface-lighter rounded-lg divide-y divide-surface-lighter">
                            <div className="px-5 py-4 relative" ref={presetMenuRef}>
                                <div className="flex items-center justify-between gap-6">
                                    <div className="shrink-0">
                                        <p className="text-[12px] font-bold text-foreground mb-0.5">Preset</p>
                                        <p className="text-[10px] font-bold text-muted-foreground">Quick theme templates</p>
                                    </div>
                                    <button
                                        onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                                        className="h-8 flex items-center gap-2 px-3 bg-surface-light border border-surface-lighter rounded-md text-[11px] font-bold text-foreground hover:bg-surface-lighter/30 transition-all cursor-pointer"
                                    >
                                        <span className="font-mono uppercase tracking-widest">
                                            {currentTemplate?.name || "Custom"}
                                        </span>
                                        <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={`text-muted-foreground transition-transform ${isPresetMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {isPresetMenuOpen && (
                                    <div className="absolute right-5 top-full mt-1 w-56 border border-surface-lighter rounded-lg shadow-lg z-50 overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                                        <div className="p-1 max-h-64 overflow-y-auto custom-scrollbar-prominent">
                                            {themeTemplates.map((template) => (
                                                <button
                                                    key={template.name}
                                                    onClick={() => applyTemplate(template)}
                                                    className="w-full px-3 py-2 text-left rounded-md hover:bg-surface-lighter/30 transition-all flex items-center justify-between"
                                                >
                                                    <div>
                                                        <span className="text-[11px] font-bold text-foreground block leading-tight">{template.name}</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground tracking-wide">{template.description}</span>
                                                    </div>
                                                    {currentTemplate?.name === template.name && (
                                                        <HugeiconsIcon icon={Tick01Icon} size={14} className="text-brand shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Brand Color */}
                            <div className="px-5 py-4">
                                <div className="flex items-center justify-between gap-6 mb-4">
                                    <div className="shrink-0">
                                        <p className="text-[12px] font-bold text-foreground mb-0.5">Brand Color</p>
                                        <p className="text-[10px] font-bold text-muted-foreground">Primary accent color</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer group/color">
                                        <div
                                            className="w-7 h-7 rounded-md border border-surface-lighter transition-all group-hover/color:scale-105 relative overflow-hidden"
                                            style={{ backgroundColor: config.brandColor }}
                                        >
                                            <input
                                                type="color"
                                                value={config.brandColor}
                                                onChange={(e) => updateConfig('brandColor', e.target.value)}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] font-mono">{config.brandColor}</span>
                                    </label>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {colorPresets.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => updateConfig('brandColor', color.value)}
                                            className={`w-7 h-7 rounded-md border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                                config.brandColor === color.value ? 'border-brand ring-1 ring-brand ring-offset-1 ring-offset-surface' : 'border-surface-lighter'
                                            }`}
                                            style={{ backgroundColor: color.value }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="px-5 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[12px] font-bold text-foreground mb-0.5">Compact Mode</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Optimize layout density</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('isCompact', !config.isCompact)}
                                    className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${config.isCompact ? 'bg-brand' : 'bg-surface-lighter'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${config.isCompact ? 'left-[18px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <div className="px-5 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[12px] font-bold text-foreground mb-0.5">Force Dark Mode</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Disable user theme switching</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const val = !config.isDark;
                                        const newConfig = { ...config, isDark: val };
                                        if (config.brandColor === '#000000' && val) newConfig.brandColor = '#ffffff';
                                        else if (config.brandColor === '#ffffff' && !val) newConfig.brandColor = '#000000';
                                        setConfig(newConfig);
                                        fetch('/api/v1/client/admin/customization', {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(newConfig)
                                        }).then(res => res.json()).then(data => {
                                            if (data.ok) setOriginalConfig(newConfig);
                                        });
                                    }}
                                    className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${config.isDark ? 'bg-brand' : 'bg-surface-lighter'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${config.isDark ? 'left-[18px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Advanced Colors */}
                    <div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5 mb-4 hover:text-foreground transition-all cursor-pointer"
                        >
                            Advanced Palette
                            <HugeiconsIcon icon={ArrowDown01Icon} size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>

                        {showAdvanced && (
                            <div className="border border-surface-lighter rounded-lg divide-y divide-surface-lighter">
                                {advancedColors.map((item) => (
                                    <div key={item.key} className="px-5 py-3 flex items-center justify-between hover:bg-surface-light/30 transition-all">
                                        <span className="text-[11px] font-bold text-muted-foreground">{item.label}</span>
                                        <label className="flex items-center gap-2 cursor-pointer group/color">
                                            <span className="text-[10px] font-bold text-muted-foreground/60 font-mono uppercase tracking-[0.1em]">{config[item.key]}</span>
                                            <div
                                                className="w-6 h-6 rounded-md border border-surface-lighter transition-all group-hover/color:scale-105 relative overflow-hidden"
                                                style={{ backgroundColor: config[item.key] }}
                                            >
                                                <input
                                                    type="color"
                                                    value={config[item.key]}
                                                    onChange={(e) => updateConfig(item.key, e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                                                />
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
        </div>
    );
}
