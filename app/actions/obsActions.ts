import { gooeyToast } from "goey-toast";

export const toggleStudioMode = (obsSocket: WebSocket | null) => {
    if (!obsSocket || obsSocket.readyState !== WebSocket.OPEN) {
        gooeyToast.error("OBS tidak terhubung!");
        return;
    }

    obsSocket.send(JSON.stringify({
        op: 6,
        d: {
            requestType: "SetStudioModeEnabled",
            requestData: { studioModeEnabled: true },
            requestId: "toggle_studio",
        },
    }));
}

export const triggerTransition = (obsSocket: WebSocket | null) => {
    if (!obsSocket || obsSocket.readyState !== WebSocket.OPEN) {
        gooeyToast.error("OBS tidak terhubung!");
        return;
    }

    obsSocket.send(JSON.stringify({
        op: 6,
        d: {
            requestType: "TriggerStudioModeTransition",
            requestId: "trigger_transition",
        },
    }));
}