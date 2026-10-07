// Backward compatibility - new source of truth is `app/overlay/themes/*`
// Keep this file as re-export so existing imports (`@/app/overlay/components/theme`) still work
// For new code, import from "@/app/overlay/themes"

export * from "../themes";
