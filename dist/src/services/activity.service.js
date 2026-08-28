import { prisma } from "../lib/database.js";
import { ActivityReportSchema } from "../lib/zod.js";
/**
 * Learning-activity reporting from Kotlead Desktop.
 *
 * This is deliberately a different table family from `DeviceSyncState`. Sync
 * state answers "does this machine have the right content". These rows answer
 * "what is the person on this machine actually doing with it" — how long the
 * app stays open, what courses and lessons they look at, how many questions
 * they practise and how well.
 *
 * # Idempotence
 *
 * Every row carries a `uid` generated on the device. The unique key is
 * `(device, uid)`, and inserts use `skipDuplicates`. A device that sends a
 * batch, does not see the reply, and retries therefore cannot double-count.
 */
/** Max activity rows a device is allowed to push in one call. */
const BATCH_CAP = 500;
export const ReportActivity = async (c) => {
    const device = c.get("device");
    const report = ActivityReportSchema.parse(await c.req.json());
    const sessions = report.sessions.slice(0, BATCH_CAP);
    const events = report.events.slice(0, BATCH_CAP);
    const attempts = report.practiceAttempts.slice(0, BATCH_CAP);
    // Profile is upserted rather than inserted: a machine's student identity
    // changes when the app's local profile is edited, and the last report wins.
    if (report.profile && Object.keys(report.profile).some((k) => report.profile[k] !== undefined)) {
        const { name, class: klass, school, guardianName, guardianPhone, guardianEmail } = report.profile;
        await prisma.deviceProfile.upsert({
            where: { deviceId: device.id },
            create: {
                deviceId: device.id,
                name,
                class: klass,
                school,
                guardianName,
                guardianPhone,
                guardianEmail,
            },
            update: {
                name,
                class: klass,
                school,
                guardianName,
                guardianPhone,
                guardianEmail,
            },
        });
    }
    const [sessionResult, activityResult, attemptResult] = await Promise.all([
        sessions.length > 0
            ? prisma.deviceSession.createMany({
                data: sessions.map((s) => ({
                    deviceId: device.id,
                    uid: s.uid,
                    startedAt: s.startedAt,
                    endedAt: s.endedAt ?? null,
                    durationSeconds: s.durationSeconds ?? null,
                })),
                skipDuplicates: true,
            })
            : Promise.resolve({ count: 0 }),
        events.length > 0
            ? prisma.deviceActivity.createMany({
                data: events.map((e) => ({
                    deviceId: device.id,
                    uid: e.uid,
                    eventType: e.eventType,
                    entityType: e.entityType,
                    entityId: e.entityId,
                    entityName: e.entityName ?? null,
                    occurredAt: e.occurredAt,
                    durationSeconds: e.durationSeconds ?? null,
                    payload: e.payload ?? undefined,
                })),
                skipDuplicates: true,
            })
            : Promise.resolve({ count: 0 }),
        attempts.length > 0
            ? prisma.devicePracticeAttempt.createMany({
                data: attempts.map((a) => ({
                    deviceId: device.id,
                    uid: a.uid,
                    practiceTitle: a.practiceTitle ?? null,
                    attemptedAt: a.attemptedAt,
                    correct: a.correct,
                    total: a.total,
                    score: a.score,
                    answers: a.answers ?? undefined,
                })),
                skipDuplicates: true,
            })
            : Promise.resolve({ count: 0 }),
    ]);
    return c.json({
        accepted: {
            sessions: sessionResult.count,
            events: activityResult.count,
            practiceAttempts: attemptResult.count,
        },
        profileUpdated: !!report.profile,
    });
};
/** Event kinds that count as studying a piece of content, for top-subjects. */
const STUDY_EVENT_TYPES = [
    "course_view",
    "lesson_view",
    "video_time",
    "video_complete",
];
/**
 * Fleet-wide usage, for the Control Centre insights screen.
 *
 * Aggregation is coarse on purpose: insights answer "is the product being used
 * and where is the effort going", not "what exactly did one student click".
 * Per-device detail lives on the device page.
 */
export const GetInsightsSummary = async (c) => {
    const now = new Date();
    const dayStart = (d) => {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    };
    const todayStart = dayStart(now);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const daysBack = 13;
    const [sessionAgg, weekAgg, attemptsAgg, todayActivity, activeToday, daily, topSubjects, topPractices,] = await Promise.all([
        prisma.deviceSession.aggregate({
            _count: { _all: true },
            _sum: { durationSeconds: true },
        }),
        prisma.deviceSession.aggregate({
            where: { startedAt: { gte: weekStart } },
            _sum: { durationSeconds: true },
        }),
        prisma.devicePracticeAttempt.aggregate({
            _count: { _all: true },
            _avg: { score: true },
        }),
        prisma.deviceActivity.count({
            where: { occurredAt: { gte: since24h } },
        }),
        prisma.$queryRaw `SELECT COUNT(DISTINCT "deviceId") AS devices FROM "DeviceSession" WHERE "startedAt" >= ${since24h}`,
        prisma.$queryRaw `SELECT
        date_trunc('day', "startedAt")::date AS day,
        SUM(COALESCE("durationSeconds", 0)) AS seconds,
        COUNT(*) AS sessions,
        COUNT(DISTINCT "deviceId") AS devices
      FROM "DeviceSession"
      WHERE "startedAt" >= ${dayStart(new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000))}
      GROUP BY 1
      ORDER BY 1`,
        prisma.deviceActivity.groupBy({
            by: ["entityName", "eventType"],
            where: { eventType: { in: STUDY_EVENT_TYPES } },
            _sum: { durationSeconds: true },
            _count: { _all: true },
        }),
        prisma.devicePracticeAttempt.groupBy({
            by: ["practiceTitle"],
            _count: { _all: true },
            _avg: { score: true },
        }),
    ]);
    const toNumber = (v) => v == null ? 0 : Number(v);
    const subjectMap = new Map();
    for (const row of topSubjects) {
        const name = row.entityName ?? "Unknown";
        const entry = subjectMap.get(name) ?? { views: 0, seconds: 0 };
        entry.views += row._count._all;
        entry.seconds += toNumber(row._sum.durationSeconds);
        subjectMap.set(name, entry);
    }
    const dailyMap = new Map();
    for (const row of daily) {
        const key = row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10);
        dailyMap.set(key, {
            seconds: toNumber(row.seconds),
            sessions: toNumber(row.sessions),
            devices: toNumber(row.devices),
        });
    }
    // Zero-fill the last N days so the chart has a stable shape even on days
    // where nothing was uploaded.
    const series = [];
    for (let i = daysBack; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const row = dailyMap.get(key);
        series.push({
            date: key,
            studyMinutes: Math.round((row?.seconds ?? 0) / 60),
            sessions: row?.sessions ?? 0,
            activeDevices: row?.devices ?? 0,
        });
    }
    return c.json({
        generatedAt: now.toISOString(),
        summary: {
            sessions: sessionAgg._count._all,
            totalStudyMinutes: Math.round(toNumber(sessionAgg._sum.durationSeconds) / 60),
            studyMinutesThisWeek: Math.round(toNumber(weekAgg._sum.durationSeconds) / 60),
            practiceAttempts: attemptsAgg._count._all,
            averageScore: attemptsAgg._avg.score
                ? Math.round(attemptsAgg._avg.score)
                : 0,
            eventsToday: todayActivity,
            activeDevicesToday: toNumber(activeToday[0]?.devices),
        },
        dailyStudy: series,
        topSubjects: [...subjectMap.entries()]
            .map(([name, data]) => ({
            name,
            views: data.views,
            studyMinutes: Math.round(data.seconds / 60),
        }))
            .sort((a, b) => b.studyMinutes - a.studyMinutes)
            .slice(0, 8),
        topPractices: topPractices
            .map((p) => ({
            title: p.practiceTitle ?? "Untitled practice",
            attempts: p._count._all,
            score: p._avg.score ? Math.round(p._avg.score) : 0,
        }))
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 8),
    });
};
