import { ensureSession } from "@/lib/auth.functions";
import type {
	ActivityEvent,
	ActivityGroup,
} from "@/lib/activity.functions";
import { prisma } from "@/lib/prisma";

export async function getActivities(): Promise<ActivityGroup[]> {
	const session = await ensureSession();

	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const activities: ActivityEvent[] = [];

	// 1. User's report status changes
	const userReports = await prisma.report.findMany({
		where: {
			userId: session.user.id,
			updatedAt: { gte: sevenDaysAgo },
			OR: [
				{ status: "VERIFIED" },
				{ status: "REJECTED" },
			],
		},
		select: {
			id: true,
			title: true,
			status: true,
			updatedAt: true,
		},
		orderBy: { updatedAt: "desc" },
		take: 20,
	});

	for (const report of userReports) {
		if (report.status === "VERIFIED") {
			activities.push({
				id: `report-${report.id}`,
				type: "verified",
				time: report.updatedAt,
				title: "Laporan terverifikasi",
				description: `"${report.title}" telah diverifikasi oleh sistem komunitas.`,
				relatedId: report.id,
			});
		} else if (report.status === "REJECTED") {
			activities.push({
				id: `report-${report.id}`,
				type: "rejected",
				time: report.updatedAt,
				title: "Laporan ditolak",
				description: `"${report.title}" belum memiliki bukti yang cukup.`,
				relatedId: report.id,
			});
		}
	}

	// 2. Recent insights
	const recentInsights = await prisma.insight.findMany({
		where: {
			generatedAt: { gte: sevenDaysAgo },
		},
		select: {
			id: true,
			title: true,
			impact: true,
			generatedAt: true,
			locationName: true,
		},
		orderBy: { generatedAt: "desc" },
		take: 10,
	});

	for (const insight of recentInsights) {
		activities.push({
			id: `insight-${insight.id}`,
			type: insight.impact === "Tinggi" ? "risk-new" : "community",
			time: insight.generatedAt,
			title:
				insight.impact === "Tinggi"
					? "Peringatan baru di sekitar"
					: "Insight baru tersedia",
			description:
				insight.impact === "Tinggi"
					? `Risiko terdeteksi di ${insight.locationName}`
					: `"${insight.title}" - analisis baru dari laporan komunitas.`,
			relatedId: insight.id,
		});
	}

	activities.sort((a, b) => b.time.getTime() - a.time.getTime());

	// Group by day
	const groups: ActivityGroup[] = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	const todayEvents: ActivityEvent[] = [];
	const yesterdayEvents: ActivityEvent[] = [];
	const olderEvents: ActivityEvent[] = [];

	for (const activity of activities) {
		const activityDate = new Date(activity.time);
		activityDate.setHours(0, 0, 0, 0);

		if (activityDate.getTime() === today.getTime()) {
			todayEvents.push(activity);
		} else if (activityDate.getTime() === yesterday.getTime()) {
			yesterdayEvents.push(activity);
		} else {
			olderEvents.push(activity);
		}
	}

	if (todayEvents.length > 0) groups.push({ day: "Hari ini", events: todayEvents });
	if (yesterdayEvents.length > 0) groups.push({ day: "Kemarin", events: yesterdayEvents });
	if (olderEvents.length > 0) groups.push({ day: "Minggu ini", events: olderEvents });

	return groups;
}
