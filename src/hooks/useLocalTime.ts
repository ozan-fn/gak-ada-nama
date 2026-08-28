import { useEffect, useState } from "react";
import { getIndonesianTimezone } from "#/lib/timezoneUtils";

export function useLocalTime(longitude?: number | null) {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 1000 * 30);
		return () => clearInterval(interval);
	}, []);

	const timezone = getIndonesianTimezone(longitude);

	const time = now.toLocaleTimeString("id-ID", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: timezone.zone,
	});

	return `${time} ${timezone.label}`;
}
