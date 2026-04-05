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
    const [showCustomColor, setShowCustomColor] = useState(false);
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
                surface: "#ffffff", surfaceDark: "#0A0A0A", surfaceLight: "#f4f4f5", surfaceLightDark: "#171717",
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

    const advancedColorsLight = [
        { label: "Brand Color", key: "brandColor" },
        { label: "Brand Hover", key: "brandHover" },
        { label: "Primary", key: "surface" },
        { label: "Secondary", key: "surfaceLight" },
        { label: "Tertiary", key: "surfaceHighlight" },
        { label: "Quaternary", key: "surfaceLighter" },
        { label: "Muted Text", key: "mutedForeground" },
        { label: "Body Text", key: "foreground" },
        { label: "Border", key: "borderColor" },
    ];

    const advancedColorsDark = [
        { label: "Brand Color", key: "brandColorDark" },
        { label: "Brand Hover", key: "brandHoverDark" },
        { label: "Primary Dark", key: "surfaceDark" },
        { label: "Secondary Dark", key: "surfaceLightDark" },
        { label: "Tertiary Dark", key: "surfaceHighlightDark" },
        { label: "Quaternary Dark", key: "surfaceLighterDark" },
        { label: "Muted Text Dark", key: "mutedForegroundDark" },
        { label: "Body Text Dark", key: "foregroundDark" },
        { label: "Border Dark", key: "borderColorDark" },
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
        <div className="bg-surface px-10 py-10">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Customization</h1>
                    <p className="text-[13px] font-bold text-muted-foreground mt-2">Configure your platform's appearance and branding</p>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-8 px-4 flex items-center gap-2 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
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

            {/* Branding */}
            <div className="mb-10">
                <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">Branding</h2>
                <div className="border border-surface-lighter rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Site Name</label>
                            <input
                                type="text"
                                value={config.siteName}
                                onChange={(e) => updateConfig('siteName', e.target.value)}
                                className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[12px] font-bold text-foreground focus:outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Logo Path</label>
                            <input
                                type="text"
                                value={config.logoUrl}
                                onChange={(e) => updateConfig('logoUrl', e.target.value)}
                                className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[11px] font-bold text-foreground font-mono focus:outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Accent Color</label>
                        <div className="flex flex-wrap items-center gap-2">
                            {colorPresets.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => updateConfig('brandColor', color.value)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                        config.brandColor === color.value ? 'border-foreground/30 ring-1 ring-foreground/10' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setShowCustomColor(!showCustomColor)}
                            className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-all cursor-pointer"
                        >
                            Custom Color
                            <HugeiconsIcon icon={ArrowDown01Icon} size={10} className={`transition-transform ${showCustomColor ? 'rotate-180' : ''}`} />
                        </button>
                        {showCustomColor && (
                            <div className="mt-3 flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-lg border border-surface-lighter shrink-0"
                                    style={{ backgroundColor: config.brandColor }}
                                />
                                <input
                                    type="text"
                                    value={config.brandColor}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                            setConfig(prev => ({ ...prev, brandColor: val }));
                                        }
                                    }}
                                    onBlur={() => {
                                        if (/^#[0-9A-Fa-f]{6}$/.test(config.brandColor)) {
                                            updateConfig('brandColor', config.brandColor);
                                        }
                                    }}
                                    maxLength={7}
                                    className="w-[100px] h-8 px-2.5 bg-surface-light/50 border border-surface-lighter rounded-md text-[11px] font-bold text-foreground font-mono uppercase focus:outline-none focus:border-brand/20 transition-all"
                                    placeholder="#000000"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Theme */}
            <div className="mb-10">
                <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">Theme</h2>
                <div className="border border-surface-lighter rounded-lg p-6 space-y-6">
                    <div className="flex items-center justify-between relative" ref={presetMenuRef}>
                        <div>
                            <p className="text-[13px] font-bold text-foreground tracking-tight">Preset Template</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Apply a preconfigured color scheme</p>
                        </div>
                        <button
                            onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                            className="h-8 flex items-center gap-2 px-3 border border-surface-lighter rounded-md text-[11px] font-bold text-foreground hover:border-foreground/20 transition-all cursor-pointer"
                        >
                            <span className="font-mono tracking-wide">{currentTemplate?.name || "Custom"}</span>
                            <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={`text-muted-foreground transition-transform ${isPresetMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isPresetMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 border border-surface-lighter rounded-lg shadow-xl z-50 overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                                <div className="p-1 max-h-64 overflow-y-auto custom-scrollbar-prominent">
                                    {themeTemplates.map((template) => (
                                        <button
                                            key={template.name}
                                            onClick={() => applyTemplate(template)}
                                            className="w-full px-3 py-2 text-left rounded-md hover:bg-surface-light transition-all flex items-center justify-between"
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

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-bold text-foreground tracking-tight">Compact Mode</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Optimize layout density</p>
                        </div>
                        <button
                            onClick={() => handleToggle('isCompact', !config.isCompact)}
                            className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${config.isCompact ? 'bg-foreground' : 'bg-surface-lighter'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-all ${config.isCompact ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-bold text-foreground tracking-tight">Force Dark Mode</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Disable user theme switching</p>
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
                            className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${config.isDark ? 'bg-foreground' : 'bg-surface-lighter'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-all ${config.isDark ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Typography */}
            <div className="mb-10">
                <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">Typography</h2>
                <div className="border border-surface-lighter rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Font Family</label>
                            <input
                                type="text"
                                value={config.fontFamily}
                                onChange={(e) => updateConfig('fontFamily', e.target.value)}
                                className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[11px] font-bold text-foreground font-mono focus:outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Border Radius</label>
                            <input
                                type="text"
                                value={config.borderRadius}
                                onChange={(e) => updateConfig('borderRadius', e.target.value)}
                                className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[11px] font-bold text-foreground font-mono focus:outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Palette */}
            <div className="mb-10">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-[14px] font-bold text-foreground/60 tracking-tight mb-4 hover:text-foreground transition-all cursor-pointer"
                >
                    Advanced Palette
                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                    <div className="border border-surface-lighter rounded-lg">
                        {/* Light Mode */}
                        <div className="p-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-5">Light Mode</p>
                            <div className="grid grid-cols-3 gap-3">
                                {advancedColorsLight.map((item) => (
                                    <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-surface-light/30">
                                        <div
                                            className="w-8 h-8 rounded-lg border border-surface-lighter shrink-0"
                                            style={{ backgroundColor: config[item.key] }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 truncate">{item.label}</label>
                                            <input
                                                type="text"
                                                value={config[item.key]}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                        setConfig(prev => ({ ...prev, [item.key]: val }));
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(config[item.key])) {
                                                        updateConfig(item.key, config[item.key]);
                                                    }
                                                }}
                                                maxLength={7}
                                                className="w-full h-6 px-0 bg-transparent text-[10px] font-bold text-muted-foreground font-mono uppercase focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-surface-lighter" />

                        {/* Dark Mode */}
                        <div className="p-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-5">Dark Mode</p>
                            <div className="grid grid-cols-3 gap-3">
                                {advancedColorsDark.map((item) => (
                                    <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-surface-light/30">
                                        <div
                                            className="w-8 h-8 rounded-lg border border-surface-lighter shrink-0"
                                            style={{ backgroundColor: config[item.key] }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 truncate">{item.label}</label>
                                            <input
                                                type="text"
                                                value={config[item.key]}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                        setConfig(prev => ({ ...prev, [item.key]: val }));
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(config[item.key])) {
                                                        updateConfig(item.key, config[item.key]);
                                                    }
                                                }}
                                                maxLength={7}
                                                className="w-full h-6 px-0 bg-transparent text-[10px] font-bold text-muted-foreground font-mono uppercase focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
