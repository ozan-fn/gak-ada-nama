import { createServerFn } from "@tanstack/react-start";

export type ActivityEventType =
	| "verified"
	| "rejected"
	| "updated"
	| "risk-new"
	| "risk-resolved"
	| "community";

export type ActivityEvent = {
	id: string;
	type: ActivityEventType;
	time: Date;
	title: string;
	description: string;
	relatedId?: string;
};

export type ActivityGroup = {
	day: string;
	events: ActivityEvent[];
};

export const getActivitiesFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getActivities } = await import("#/lib/activity.functions.server");
		return getActivities();
	},
);
