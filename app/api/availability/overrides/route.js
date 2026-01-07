import { verifyToken } from "@/lib/auth";
import { normalizeRule } from "@/lib/availability";
import { supabase } from "@/lib/supabaseClient";
import { randomUUID } from "crypto"

export async function POST(req) {
    let user;
    try {
        user = verifyToken(req);
    }
    catch (error) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "HOST") {
        return Response.json({ error: "Forbidden request" }, { status: 401 });
    }

    const body = await req.json();
    const { overrides, timezone } = body;
    if (!Array.isArray(overrides)) {
        return Response.json({ error: "Invalid overrides" }, { status: 401 });
    }

    const recordsToInsert = [];
    const datesToDelete = new Set();

    for (const o of overrides) {
        if(!o.date){
            return Response.json({error: "Date is required"}, {status: 400});
        }
        
        datesToDelete.add(o.date);

        if (!o.isAvailable) {
            recordsToInsert.push({
                id: randomUUID(),
                host_id: user.userId,
                date: o.date,
                is_available: false,
                timezone,
            });
            continue;
        }

        if (!o.starTime || !o.endTime) {
            return Response.json(
                { error: 'startTime and endTime required for available override' },
                { status: 403 });
        }

        const rules = normalizeRule({
            dayOfWeek: new Date(o.date).getDay(),
            startTime: o.startTime,
            endTime: o.endTime,
        })

        for (let i = 0; i < rules.length; i++) {
            const r = rules[i];
            let insertDate = o.date;

            if (i > 0) {
                const d = new Date(o.date);
                d.setDate(d.getDate() + 1);
                insertDate = d.toISOString().split('T')[0];
                datesToDelete.add(insertDate);
            }

            recordsToInsert.push({
                id: randomUUID(),
                host_id: user.userId,
                date: insertDate,
                is_available: true,
                start_time: r.startTime,
                end_time: r.endTime,
                timezone,
            });
        }
    }

    const { error: deleteError } = await supabase
        .from("date_overrides")
        .delete()
        .eq("host_id", user.userId)
        .in("date", Array.from(datesToDelete));

    if (deleteError) {
        return Response.json({ error: deleteError.message }, { status: 500 });
    }

    if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from("date_overrides")
            .insert(recordsToInsert)

        if (insertError) {
            return Response.json({ error: insertError.message }, { status: 500 });
        }

    }

    return Response.json({ success: true });
}