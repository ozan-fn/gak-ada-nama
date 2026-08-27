import { createServerFn } from "@tanstack/react-start";

export type PublicFirePoint = {
	lat: number;
	lon: number;
	brightness: number;
	confidence: number;
	frp: number;
	acq_date: string;
	acq_time: string;
};

type FireDataInput = {
	west: number;
	south: number;
	east: number;
	north: number;
	dayRange?: number;
};

function validateFireDataInput(input: FireDataInput): FireDataInput {
	const coordinates = [input.west, input.south, input.east, input.north];
	if (coordinates.some((value) => !Number.isFinite(value))) {
		throw new Error("Batas wilayah FIRMS tidak valid");
	}
	if (
		input.west < -180 ||
		input.east > 180 ||
		input.south < -90 ||
		input.north > 90 ||
		input.west >= input.east ||
		input.south >= input.north
	) {
		throw new Error("Batas wilayah FIRMS di luar rentang geografis");
	}

	return {
		...input,
		dayRange: Math.max(1, Math.min(10, Math.round(input.dayRange ?? 5))),
	};
}

export const getFireDataFn = createServerFn({ method: "GET" })
	.validator(validateFireDataInput)
	.handler(async ({ data }): Promise<PublicFirePoint[]> => {
		const { fetchFirmsFirePoints } = await import("#/lib/firms.server");
		const points = await fetchFirmsFirePoints(
			{
				west: data.west,
				south: data.south,
				east: data.east,
				north: data.north,
			},
			data.dayRange,
		);

		return points
			.filter((point) => point.confidence >= 50)
			.map((point) => ({
				lat: point.latitude,
				lon: point.longitude,
				brightness: point.brightness,
				confidence: point.confidence,
				frp: point.frp,
				acq_date: point.observedAt.toISOString().slice(0, 10),
				acq_time: point.observedAt.toISOString().slice(11, 16).replace(":", ""),
			}));
	});
