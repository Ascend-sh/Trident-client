import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Check } from "lucide-react";

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

    const hasChanges = originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulated delay to showcase the new loader animation
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

    const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
    const presetMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (presetMenuRef.current && !presetMenuRef.current.contains(event.target)) {
                setIsPresetMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        // Optimistic update
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
            // Optionally revert on error: setConfig(prev => ({ ...prev, [key]: !value }));
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
            }
        },

        {
            name: "Signature",
            description: "Platform brand identity",
            config: {
                brandColor: "#b0f97d",
                brandColorDark: "#b0f97d",
                brandHover: "#a0f06d",
                brandHoverDark: "#a0f06d",
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
            }
        },
        {
            name: "Oceanic",
            description: "Professional cobalt",
            config: { brandColor: "#1e40af", isCompact: false, isDark: true }
        },
        {
            name: "Cyberpunk",
            description: "Neon violet energy",
            config: { brandColor: "#7c3aed", isCompact: true, isDark: true }
        },
        {
            name: "Forest",
            description: "Organic emerald shades",
            config: { brandColor: "#065f46", isCompact: false, isDark: true }
        },
        {
            name: "Ruby",
            description: "Sleek crimson accent",
            config: { brandColor: "#991b1b", isCompact: true, isDark: true }
        },
        {
            name: "Clean",
            description: "Standard slate light",
            config: { brandColor: "#475569", isCompact: false, isDark: false }
        },
        {
            name: "Carbon",
            description: "Matte grey professional",
            config: { brandColor: "#27272a", isCompact: true, isDark: true }
        }
    ];

    const currentTemplate = themeTemplates.find(t =>
        t.config.brandColor === config.brandColor && t.config.isCompact === config.isCompact
    );

    const applyTemplate = (template) => {
        setConfig(prev => ({ ...prev, ...template.config }));
        setIsPresetMenuOpen(false);
    };

    if (isLoading) {
        return (
            <div className="bg-surface px-10 py-10 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-brand/10 border-t-brand animate-spin" />
                    <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Loading Configuration</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface px-10 py-10 min-h-screen">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Customization</h1>
                    <p className="text-[13px] font-bold text-muted-foreground mt-2">Configure global site settings and customize your platform's appearance </p>
                </div>

                <div className="flex gap-2">
                    {hasChanges && (
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-8 px-6 text-[10px] font-bold uppercase tracking-widest bg-brand text-surface hover:bg-brand/90 transition-all animate-in fade-in slide-in-from-right-2 cursor-pointer"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin mr-2" />
                                    Saving
                                </>
                            ) : "Save Changes"}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Site Name</Label>

                            <Input
                                value={config.siteName}
                                onChange={(e) => updateConfig('siteName', e.target.value)}
                                className="h-9 bg-surface border-surface-lighter text-[12px] font-bold focus:border-brand/20 transition-all rounded-md"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Logo Resource Path</Label>

                            <Input
                                value={config.logoUrl}
                                onChange={(e) => updateConfig('logoUrl', e.target.value)}
                                className="h-9 bg-surface border-surface-lighter text-[12px] font-mono focus:border-brand/20 transition-all rounded-md uppercase tracking-tight"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 block mb-3">Visual Theme</span>
                        <div className="border border-surface-lighter rounded-lg overflow-hidden bg-surface-light/20">
                            <div className="p-5 space-y-6">
                                <div className="space-y-1.5 relative" ref={presetMenuRef}>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Theme Preset Template</Label>

                                    <button
                                        onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                                        className="w-full h-9 flex items-center justify-between px-4 bg-surface border border-surface-lighter rounded-md text-[11px] font-bold text-foreground uppercase tracking-widest hover:bg-surface-light/50 transition-all font-mono"
                                    >
                                        <div className="flex items-center gap-2">
                                            {currentTemplate ? (
                                                currentTemplate.name
                                            ) : (
                                                <span className="text-muted-foreground italic">Custom Style</span>
                                            )}
                                        </div>
                                        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isPresetMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>


                                    {isPresetMenuOpen && (
                                        <div className="absolute top-[100%] left-0 right-0 mt-1.5 bg-surface border border-surface-lighter rounded-md z-50 py-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] animate-[fadeIn_0.1s_ease-out] max-h-64 overflow-y-scroll custom-scrollbar-prominent">
                                            {themeTemplates.map((template) => (
                                                <button
                                                    key={template.name}
                                                    onClick={() => applyTemplate(template)}
                                                    className="w-full px-4 py-2.5 text-left hover:bg-surface-light transition-all flex items-center justify-between group border-b border-surface-lighter/30 last:border-0"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-foreground uppercase tracking-widest leading-tight">{template.name}</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">{template.description}</span>
                                                    </div>

                                                    {currentTemplate?.name === template.name && (
                                                        <Check size={12} className="text-brand/60" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-surface-lighter/40">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Brand Accent Color</Label>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {colorPresets.map((color) => (
                                            <button
                                                key={color.value}
                                                onClick={() => updateConfig('brandColor', color.value)}
                                                className={`w-7 h-7 rounded-sm border transition-all hover:scale-105 active:scale-95 ${config.brandColor === color.value ? 'border-brand ring-1 ring-brand ring-offset-1' : 'border-surface-lighter'
                                                    }`}
                                                style={{ backgroundColor: color.value }}
                                            />
                                        ))}
                                        <div className="w-[1px] h-6 bg-surface-lighter mx-1" />
                                        <label className="flex items-center gap-2 cursor-pointer group/color ml-1">
                                            <div
                                                className="w-7 h-7 rounded-sm border border-surface-lighter transition-all group-hover/color:scale-105 active:scale-95 relative overflow-hidden"
                                                style={{ backgroundColor: config.brandColor }}
                                            >
                                                <input
                                                    type="color"
                                                    value={config.brandColor}
                                                    onChange={(e) => updateConfig('brandColor', e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-foreground uppercase tracking-[0.2em] font-mono group-hover/color:text-foreground/60 transition-colors">{config.brandColor}</span>
                                        </label>

                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-surface-lighter/40">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Advanced Color Palette</Label>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
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
                                        ].map((item) => (

                                            <div key={item.key} className="space-y-1.5 p-2.5 rounded-md border border-surface-lighter/50 bg-surface transition-all hover:border-brand/20">
                                                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">{item.label}</Label>

                                                <label className="flex items-center gap-2 cursor-pointer group/color">
                                                    <div
                                                        className="w-7 h-7 rounded-sm border border-surface-lighter transition-all group-hover/color:scale-105 active:scale-95 relative overflow-hidden"
                                                        style={{ backgroundColor: config[item.key] }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={config[item.key]}
                                                            onChange={(e) => updateConfig(item.key, e.target.value)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-foreground uppercase tracking-[0.2em] font-mono group-hover/color:text-foreground/60 transition-colors">{config[item.key]}</span>
                                                </label>

                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10 pt-4 border-t border-surface-lighter/40">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-[10px] font-bold text-foreground uppercase tracking-widest">Compact Mode</Label>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Optimize density</p>
                                        </div>

                                        <Switch
                                            checked={config.isCompact}
                                            onCheckedChange={(val) => handleToggle('isCompact', val)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-[10px] font-bold text-foreground uppercase tracking-widest">Dark Persistence</Label>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Bypass light theme</p>
                                        </div>

                                        <Switch
                                            checked={config.isDark}
                                            onCheckedChange={(val) => {
                                                const newConfig = { ...config, isDark: val };
                                                if (config.brandColor === '#000000' && val) newConfig.brandColor = '#ffffff';
                                                else if (config.brandColor === '#ffffff' && !val) newConfig.brandColor = '#000000';

                                                // We call handleToggle logic manually here to handle the dependent brandColor update
                                                setConfig(newConfig);
                                                fetch('/api/v1/client/admin/customization', {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(newConfig)
                                                }).then(res => res.json()).then(data => {
                                                    if (data.ok) setOriginalConfig(newConfig);
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <div className="sticky top-24">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 block mb-3">Instant Preview</span>

                        <div className="border border-surface-lighter rounded-xl overflow-hidden bg-surface-light border-dashed p-4">
                            <Card className="border border-surface-lighter ring-0 overflow-hidden bg-surface shadow-none rounded-lg">
                                <div className="h-5 bg-surface-light/50 border-b border-surface-lighter flex items-center px-4 justify-between">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-brand/10" />
                                        <div className="w-1 h-1 rounded-full bg-brand/10" />
                                        <div className="w-1 h-1 rounded-full bg-brand/10" />
                                    </div>
                                    <span className="text-[7px] font-bold text-brand/10 uppercase tracking-[0.3em] font-mono">{config.siteName}</span>
                                    <div className="w-2 h-2 rounded-full border border-brand/10" />
                                </div>
                                <div className="p-6 space-y-4 bg-surface min-h-[320px]">
                                    <div className={`p-4 rounded-md border border-surface-lighter bg-surface-light/30 transition-all ${config.isCompact ? 'py-2' : 'py-4'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="space-y-1">
                                                <div className="w-8 h-1 bg-brand/5 rounded-full" />
                                                <div className="w-16 h-1.5 bg-brand/10 rounded-full" />
                                            </div>
                                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: config.brandColor, opacity: 0.1 }} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="w-full h-1 bg-brand/5 rounded-full" />
                                            <div className="w-2/3 h-1 bg-brand/5 rounded-full" />
                                        </div>
                                        <div
                                            className="w-full mt-4 h-6 rounded-md flex items-center justify-center"
                                            style={{ backgroundColor: config.brandColor }}
                                        >
                                            <div className="w-10 h-0.5 bg-surface/50 rounded-full" />
                                        </div>
                                    </div>

                                    {[1, 2].map(i => (
                                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-surface-lighter/20 last:border-0 opacity-40">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-sm bg-brand/10" />
                                                <div className="w-12 h-1 bg-brand/20 rounded-full" />
                                            </div>
                                            <div className="w-6 h-0.5 bg-brand/10 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

