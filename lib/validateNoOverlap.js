export function validateNoOverlap(rules) {
    const byDay = {};

    for (const r of rules) {
        if (!byDay[r.dayOfWeek]) {
            byDay[r.dayOfWeek] = [];
        }

        byDay[r.dayOfWeek].push(r);
    }

    for (const day in byDay) {
        const slots = byDay[day].sort(
            (a, b) => a.startTime.localeCompare(b.startTime)
        );

        for (let i = 1; i < slots.length; i++) {
            const prev = slots[i - 1];
            const curr = slots[i];

            if (curr.startTime < prev.endTime) {
                throw new Error(
                    `Overlapping slots on day ${day}: ${prev.startTime}-${prev.endTime} and ${curr.startTime}-${curr.endTime}`
                );
            }
        }
    }
}