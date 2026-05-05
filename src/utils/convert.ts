export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};


export const convertSecondsToPixels = (seconds: number, pixelsPerSecond: number) => {
    return seconds * pixelsPerSecond;
};

export const convertPixelsToSeconds = (pixels: number, pixelsPerSecond: number) => {
    return pixels / pixelsPerSecond;
};
