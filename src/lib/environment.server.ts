export type EnvironmentCoordinates = {
	latitude: number;
	longitude: number;
};

export type EnvironmentFetchOptions = {
	signal?: AbortSignal;
	pastDays?: number;
};

export type OpenMeteoResponse = {
	latitude: number;
	longitude: number;
	elevation: number;
	timezone: string;
	current: {
		time: string;
		temperature_2m: number;
		relative_humidity_2m: number;
		precipitation: number;
		rain: number;
		wind_speed_10m: number;
		cloud_cover: number;
	};
	hourly: {
		time: string[];
		temperature_2m: number[];
		relative_humidity_2m: number[];
		precipitation_probability: number[];
		precipitation: number[];
		rain: number[];
		wind_speed_10m: number[];
	};
	daily: {
		time: string[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
		rain_sum: number[];
		precipitation_probability_max: number[];
		wind_speed_10m_max: number[];
	};
};

export type AQICNForecastPoint = {
	avg: number;
	day: string;
	max: number;
	min: number;
};

export type AQICNData = {
	aqi: number;
	idx: number;
	attributions: Array<{ url: string; name: string }>;
	city: {
		geo: [number, number];
		name: string;
		url: string;
		location: string;
	};
	dominentpol: string;
	iaqi: {
		co?: { v: number };
		h?: { v: number };
		no2?: { v: number };
		o3?: { v: number };
		p?: { v: number };
		pm10?: { v: number };
		pm25?: { v: number };
		so2?: { v: number };
		t?: { v: number };
		w?: { v: number };
	};
	time: {
		s: string;
		tz: string;
		v: number;
		iso: string;
	};
	forecast?: {
		daily: {
			o3?: AQICNForecastPoint[];
			pm10?: AQICNForecastPoint[];
			pm25?: AQICNForecastPoint[];
			uvi?: AQICNForecastPoint[];
		};
	};
	debug?: {
		sync: string;
	};
};

export type AQICNResponse = {
	status: "ok";
	data: AQICNData;
};

type AQICNProviderResponse =
	| AQICNResponse
	| {
			status: "error";
			data: unknown;
	  };

export type EnvironmentProvider = "OPEN_METEO" | "AQICN";

export type EnvironmentProviderErrorCode =
	| "INVALID_COORDINATES"
	| "NOT_CONFIGURED"
	| "HTTP_ERROR"
	| "PROVIDER_ERROR";

export class EnvironmentProviderError extends Error {
	readonly provider: EnvironmentProvider;
	readonly code: EnvironmentProviderErrorCode;
	readonly status?: number;
	readonly details?: unknown;

	constructor({
		provider,
		code,
		message,
		status,
		details,
	}: {
		provider: EnvironmentProvider;
		code: EnvironmentProviderErrorCode;
		message: string;
		status?: number;
		details?: unknown;
	}) {
		super(message);
		this.name = "EnvironmentProviderError";
		this.provider = provider;
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

const CITY_COORDINATES: Record<string, EnvironmentCoordinates> = {
	jakarta: { latitude: -6.2088, longitude: 106.8456 },
	surabaya: { latitude: -7.2575, longitude: 112.7521 },
	bandung: { latitude: -6.9175, longitude: 107.6191 },
	medan: { latitude: 3.5952, longitude: 98.6722 },
	semarang: { latitude: -6.9667, longitude: 110.4167 },
	makassar: { latitude: -5.1477, longitude: 119.4327 },
	palembang: { latitude: -2.9761, longitude: 104.7754 },
	yogyakarta: { latitude: -7.7956, longitude: 110.3695 },
	bali: { latitude: -8.4095, longitude: 115.1889 },
};

export function resolveWeatherCityCoordinates(
	city = "jakarta",
): EnvironmentCoordinates {
	return CITY_COORDINATES[city.toLowerCase()] ?? CITY_COORDINATES.jakarta;
}

function assertValidCoordinates(
	{ latitude, longitude }: EnvironmentCoordinates,
	provider: EnvironmentProvider,
): void {
	if (
		!Number.isFinite(latitude) ||
		latitude < -90 ||
		latitude > 90 ||
		!Number.isFinite(longitude) ||
		longitude < -180 ||
		longitude > 180
	) {
		throw new EnvironmentProviderError({
			provider,
			code: "INVALID_COORDINATES",
			message: "Invalid latitude or longitude",
		});
	}
}

export async function fetchWeatherByCoordinates(
	coordinates: EnvironmentCoordinates,
	options: EnvironmentFetchOptions = {},
): Promise<OpenMeteoResponse> {
	assertValidCoordinates(coordinates, "OPEN_METEO");

	const params = new URLSearchParams({
		latitude: coordinates.latitude.toString(),
		longitude: coordinates.longitude.toString(),
		current:
			"temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,cloud_cover",
		hourly:
			"temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,wind_speed_10m",
		daily:
			"temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max",
		timezone: "Asia/Jakarta",
		forecast_days: "7",
	});
	if (options.pastDays && options.pastDays > 0) {
		params.set("past_days", String(Math.min(7, Math.floor(options.pastDays))));
	}

	const response = await fetch(
		`https://api.open-meteo.com/v1/forecast?${params}`,
		{ signal: options.signal },
	);

	if (!response.ok) {
		throw new EnvironmentProviderError({
			provider: "OPEN_METEO",
			code: "HTTP_ERROR",
			message: `Open-Meteo API error: ${response.status}`,
			status: response.status,
		});
	}

	return (await response.json()) as OpenMeteoResponse;
}

function getAQICNToken(): string {
	const token = process.env.AQICN_TOKEN;

	if (!token) {
		throw new EnvironmentProviderError({
			provider: "AQICN",
			code: "NOT_CONFIGURED",
			message: "AQICN_TOKEN not configured",
		});
	}

	return token;
}

function redactSecret(value: unknown, secret: string): unknown {
	if (typeof value === "string") {
		return value.replaceAll(secret, "[REDACTED]");
	}

	if (Array.isArray(value)) {
		return value.map((item) => redactSecret(item, secret));
	}

	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [
				key.replaceAll(secret, "[REDACTED]"),
				redactSecret(item, secret),
			]),
		);
	}

	return value;
}

async function fetchAQICN(
	feed: string,
	options: EnvironmentFetchOptions,
): Promise<AQICNResponse> {
	const token = getAQICNToken();
	const params = new URLSearchParams({ token });
	const response = await fetch(
		`https://api.waqi.info/feed/${feed}/?${params}`,
		{ signal: options.signal },
	);

	if (!response.ok) {
		throw new EnvironmentProviderError({
			provider: "AQICN",
			code: "HTTP_ERROR",
			message: `AQICN API error: ${response.status}`,
			status: response.status,
		});
	}

	const rawData = (await response.json()) as AQICNProviderResponse;
	const data = redactSecret(rawData, token) as AQICNProviderResponse;

	if (data.status !== "ok") {
		throw new EnvironmentProviderError({
			provider: "AQICN",
			code: "PROVIDER_ERROR",
			message: "AQICN API returned error status",
			status: 400,
			details: data,
		});
	}

	return data;
}

export async function fetchAQIByCoordinates(
	coordinates: EnvironmentCoordinates,
	options: EnvironmentFetchOptions = {},
): Promise<AQICNResponse> {
	assertValidCoordinates(coordinates, "AQICN");

	return fetchAQICN(
		`geo:${coordinates.latitude};${coordinates.longitude}`,
		options,
	);
}

export async function fetchAQIByCity(
	city = "jakarta",
	options: EnvironmentFetchOptions = {},
): Promise<AQICNResponse> {
	return fetchAQICN(encodeURIComponent(city || "jakarta"), options);
}
