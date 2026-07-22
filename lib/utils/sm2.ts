export function calculateSM2(quality: 0 | 1 | 2 | 3, currentEaseFactor: number, currentInterval: number) {
    const sm2Quality = [0, 2, 4, 5][quality];
    let newEaseFactor = currentEaseFactor;
    let newInterval = currentInterval;

    if (sm2Quality < 3) {
        newInterval = 1; // Align with test expectations on fail
    } else {
        if (currentInterval === 0) {
            newInterval = 1;
        } else if (currentInterval === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.round(currentInterval * (newEaseFactor / 100));
        }
        const efDelta = 0.1 - (5 - sm2Quality) * (0.08 + (5 - sm2Quality) * 0.02);
        newEaseFactor = Math.max(130, Math.round(newEaseFactor + efDelta * 100));
    }
    
    // Implement full SM-2 EF update for all qualities.
    const efDelta = 0.1 - (5 - sm2Quality) * (0.08 + (5 - sm2Quality) * 0.02);
    newEaseFactor = Math.max(130, Math.round(newEaseFactor + efDelta * 100));

    return { easeFactor: newEaseFactor, interval: newInterval };
}
