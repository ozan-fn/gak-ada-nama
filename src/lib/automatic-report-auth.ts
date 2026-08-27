import { timingSafeEqual } from "node:crypto";

export function isAutomaticReportRequestAuthorized(
	authorization: string | null,
	expectedSecret: string,
) {
	const suppliedSecret = authorization?.startsWith("Bearer ")
		? authorization.slice("Bearer ".length)
		: "";
	const expected = Buffer.from(expectedSecret);
	const supplied = Buffer.from(suppliedSecret);
	return (
		expected.length === supplied.length && timingSafeEqual(expected, supplied)
	);
}
