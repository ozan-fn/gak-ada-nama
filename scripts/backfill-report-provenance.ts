import { prisma } from "../src/lib/prisma";

async function main() {
	const result = await prisma.$runCommandRaw({
		update: "report",
		updates: [
			{
				q: {
					$or: [
						{ source: { $exists: false } },
						{ source: null },
						{ deduplicationKey: { $exists: false } },
						{ deduplicationKey: null },
					],
				},
				u: [
					{
						$set: {
							source: { $ifNull: ["$source", "HUMAN"] },
							deduplicationKey: {
								$ifNull: [
									"$deduplicationKey",
									{
										$concat: [
											"legacy:",
											{ $toString: "$_id" },
										],
									},
								],
							},
						},
					},
				],
				multi: true,
			},
		],
	});

	console.info("Report provenance backfill completed", result);
}

main()
	.catch((error) => {
		console.error("Report provenance backfill failed", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
