import { Link } from "@tanstack/react-router";
import { CheckCircle2, Leaf, RotateCcw } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";

type EcoLensSuccessDialogProps = {
	open: boolean;
	onCreateAnother: () => void;
};

export function EcoLensSuccessDialog({
	open,
	onCreateAnother,
}: EcoLensSuccessDialogProps) {
	return (
		<Dialog open={open}>
			<DialogContent
				showCloseButton={false}
				className="overflow-hidden bg-white p-0 text-neutral-900 ring-1 ring-neutral-200 sm:max-w-md"
			>
				<div className="relative px-6 pb-2 pt-8 text-center">
					<div
						className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(14,165,233,.12),transparent_65%)]"
						aria-hidden="true"
					/>
					<div className="relative mx-auto grid size-14 place-items-center rounded-xl bg-emerald-50">
						<CheckCircle2 className="size-7 text-emerald-600" />
					</div>
					<DialogHeader className="relative mt-5 items-center">
						<div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
							<Leaf className="size-3" />
							Tersimpan ke Database
						</div>
						<DialogTitle className="mt-2 text-xl font-semibold text-neutral-900">
							Laporan Berhasil Terkirim
						</DialogTitle>
						<DialogDescription className="mt-2 max-w-sm text-center leading-5 text-neutral-500">
							Laporan lingkungan beserta data analisis EcoLens Anda telah berhasil disimpan dan diteruskan ke sistem penanganan.
						</DialogDescription>
					</DialogHeader>
				</div>

				<DialogFooter className="grid gap-2 border-t border-neutral-100 bg-neutral-50/60 px-6 pb-6 pt-4 sm:grid-cols-2">
					<Button
						type="button"
						variant="outline"
						onClick={onCreateAnother}
						className="h-9 rounded-lg border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
					>
						<RotateCcw className="size-3.5" />
						Buat Laporan Baru
					</Button>
					<Button
						render={<Link to="/dashboard/my-reports" />}
						className="h-9 rounded-lg bg-sky-500 font-medium text-white hover:bg-sky-600"
					>
						Lihat Laporan Saya
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
