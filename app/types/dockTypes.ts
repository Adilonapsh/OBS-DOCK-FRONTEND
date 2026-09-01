export interface DockStatus {
    simulated: boolean;
    obsStudioMode: boolean;
    obsStatus: string;
    sbotStatus: string;
    streamTime: string;
    recordTime: string;
    cpuUsage: string;
    obsFps: string;
    obsMem: string;
    bitrate?: string;
    diskSpace?: string;
    recordStatus?: "STARTED" | "PAUSED" | "STOPPED" | "RECORDING";
    streamStatus?: "STARTED" | "STOPPED" | "LIVE";
}


export interface ChatMessage {
    id: number;
    user: string;
    text: string;
    platform: "twitch" | "youtube" | "tiktok" | "kick";
    avatar?: string;
    emotes?: Array<{ name: string; imageUrl: string }>;
}