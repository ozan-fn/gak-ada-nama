import {
	AlertCircle,
	Brain,
	CheckCircle2,
	LocateFixed,
	RefreshCw,
	RotateCcw,
	Send,
	Sparkles,
	X,
} from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "#/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "#/components/ui/drawer";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import {
	ECO_LENS_CATEGORIES,
	type EcoLensAnalysis,
	type EcoLensCategory,
} from "#/types/ecolens";

export type EcoLensFormErrors = {
	location?: string;
	description?: string;
};

type EcoLensReviewDrawerProps = {
	open: boolean;
	analysis: EcoLensAnalysis | null;
	analysisError: string | null;
	category: EcoLensCategory;
	description: string;
	location: string;
	errors: EcoLensFormErrors;
	isSubmitting?: boolean;
	onOpenChange: (open: boolean) => void;
	onCategoryChange: (category: EcoLensCategory) => void;
	onDescriptionChange: (description: string) => void;
	onLocationChange: (location: string) => void;
	onRetryAnalysis: () => void;
	onRetake: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EcoLensReviewDrawer({
	open,
	analysis,
	analysisError,
	category,
	description,
	location,
	errors,
	isSubmitting = false,
	onOpenChange,
	onCategoryChange,
	onDescriptionChange,
	onLocationChange,
	onRetryAnalysis,
	onRetake,
	onSubmit,
}: EcoLensReviewDrawerProps) {
	const handleOpenChange = (nextOpen: boolean) => {
		if (isSubmitting && !nextOpen) return;
		onOpenChange(nextOpen);
	};

	return (
		<Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
			<DrawerContent className="[--drawer-bleed-background:#fff] [--drawer-content-max-height:min(88dvh,48rem)] border-neutral-200 bg-white text-neutral-900 shadow-[0_-20px_60px_rgba(15,23,42,.12)]">
				<div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-y-auto">
					<DrawerHeader className="border-b border-neutral-100 px-5 pb-3.5 pt-2 text-left sm:px-7">
						<div className="flex items-start justify-between gap-4">
							<div>
								<div className="flex items-center gap-2">
									<DrawerTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900">
										<Brain className="size-4 text-sky-600" />
										Review & Konfirmasi Laporan
									</DrawerTitle>
									<span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
										<Sparkles className="size-2.5" />
										AI Vision
									</span>
								</div>
								<DrawerDescription className="mt-1 text-xs text-neutral-500">
									Periksa hasil klasifikasi AI dan lengkapi deskripsi sebelum
									menyimpan laporan ke sistem.
								</DrawerDescription>
							</div>

							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={isSubmitting}
								onClick={() => onOpenChange(false)}
								className="rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
								aria-label="Tutup review laporan"
							>
								<X className="size-4" />
							</Button>
						</div>
					</DrawerHeader>

					<form
						onSubmit={onSubmit}
						className="grid gap-3 bg-muted/40 p-4 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]"
					>
						{/* Kolom Kiri: Hasil Analisis AI */}
						<div className="space-y-3 rounded-lg border border-neutral-100 bg-white p-4 shadow-xs">
							<div className="flex items-center justify-between">
								<h3 className="text-xs font-semibold text-neutral-900">
									Hasil Deteksi AI
								</h3>
								{analysis?.urgency && (
									<span
										className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
											analysis.urgency === "Sangat Tinggi" ||
											analysis.urgency === "Tinggi"
												? "bg-red-50 text-red-700"
												: analysis.urgency === "Sedang"
													? "bg-amber-50 text-amber-700"
													: "bg-emerald-50 text-emerald-700"
										}`}
									>
										Urgensi: {analysis.urgency}
									</span>
								)}
							</div>

							{analysisError && (
								<div
									aria-live="polite"
									className="rounded-lg border border-amber-200 bg-amber-50 p-3.5"
								>
									<div className="flex items-start gap-2.5">
										<AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
										<div className="min-w-0">
											<p className="text-xs font-semibold text-amber-900">
												Analisis Otomatis Terkendala
											</p>
											<p className="mt-1 text-[11px] leading-relaxed text-amber-800">
												{analysisError}
											</p>
											<Button
												type="button"
												variant="outline"
												onClick={onRetryAnalysis}
												className="mt-2.5 h-7 border-amber-200 bg-white text-xs text-amber-800 hover:bg-amber-100"
											>
												<RefreshCw className="size-3" />
												Ulangi Analisis
											</Button>
										</div>
									</div>
								</div>
							)}

							{analysis && (
								<div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3.5">
									<p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
										Ringkasan Visual
									</p>
									<p className="mt-1.5 text-xs leading-relaxed text-neutral-700">
										{analysis.summary}
									</p>
									<div className="mt-3 flex items-center gap-1.5 border-t border-sky-100 pt-2.5 text-[10px] text-neutral-500">
										<CheckCircle2 className="size-3 text-emerald-600" />
										<span>
											Kategori dan deskripsi telah disesuaikan secara otomatis.
										</span>
									</div>
								</div>
							)}

							{!analysis && !analysisError && (
								<div className="rounded-lg border border-neutral-200/80 bg-neutral-50 p-4 text-xs text-neutral-500 text-center">
									Foto siap ditinjau. Anda dapat mengisi form secara manual di
									samping.
								</div>
							)}
						</div>

						{/* Kolom Kanan: Form Koreksi & Simpan */}
						<div className="space-y-4 rounded-lg border border-neutral-100 bg-white p-4 shadow-xs">
							<div className="space-y-1.5">
								<Label
									htmlFor="ecolens-category"
									className="text-xs font-medium text-neutral-700"
								>
									Kategori Masalah
								</Label>
								<select
									id="ecolens-category"
									value={category}
									disabled={isSubmitting}
									onChange={(event) => {
										const selectedCategory = ECO_LENS_CATEGORIES.find(
											(item) => item === event.target.value,
										);
										if (selectedCategory) onCategoryChange(selectedCategory);
									}}
									className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 text-xs text-neutral-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
								>
									{ECO_LENS_CATEGORIES.map((item) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor="ecolens-location"
									className="text-xs font-medium text-neutral-700"
								>
									Lokasi Kejadian
								</Label>
								<div className="relative">
									<LocateFixed className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-sky-600" />
									<input
										id="ecolens-location"
										type="text"
										value={location}
										maxLength={240}
										disabled={isSubmitting}
										onChange={(event) => onLocationChange(event.target.value)}
										placeholder="Nama jalan, area, atau patokan lokasi"
										aria-invalid={Boolean(errors.location)}
										aria-describedby={
											errors.location ? "ecolens-location-error" : undefined
										}
										className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50/80 pl-9 pr-3 text-xs text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 aria-invalid:border-red-400"
									/>
								</div>
								{errors.location && (
									<p
										id="ecolens-location-error"
										className="text-[10px] text-red-600"
									>
										{errors.location}
									</p>
								)}
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor="ecolens-description"
									className="text-xs font-medium text-neutral-700"
								>
									Deskripsi Laporan
								</Label>
								<Textarea
									id="ecolens-description"
									value={description}
									maxLength={1_000}
									rows={4}
									disabled={isSubmitting}
									onChange={(event) => onDescriptionChange(event.target.value)}
									placeholder="Jelaskan detail kondisi yang terjadi..."
									aria-invalid={Boolean(errors.description)}
									aria-describedby={
										errors.description ? "ecolens-description-error" : undefined
									}
									className="min-h-24 resize-none rounded-lg border-neutral-200 bg-neutral-50/80 text-xs text-neutral-700 placeholder:text-neutral-400 focus-visible:border-sky-500 focus-visible:bg-white focus-visible:ring-sky-100"
								/>
								<div className="flex items-center justify-between gap-3">
									<p
										id="ecolens-description-error"
										className="text-[10px] text-red-600"
									>
										{errors.description}
									</p>
									<span className="ml-auto text-[10px] tabular-nums text-neutral-400">
										{description.length}/1000
									</span>
								</div>
							</div>

							<div className="grid gap-2 border-t border-neutral-100 pt-4 sm:grid-cols-2">
								<Button
									type="button"
									variant="outline"
									disabled={isSubmitting}
									onClick={onRetake}
									className="h-9 rounded-lg border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50"
								>
									<RotateCcw className="size-3.5" />
									Foto Ulang
								</Button>
								<Button
									type="submit"
									disabled={isSubmitting}
									className="h-9 rounded-lg bg-sky-500 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
								>
									{isSubmitting ? (
										<>
											<RefreshCw className="size-3.5 animate-spin" />
											<span className="whitespace-normal text-center leading-4">
												Mengumpulkan konteks &amp; menyimpan...
											</span>
										</>
									) : (
										<>
											<Send className="size-3.5" />
											Kirim Laporan
										</>
									)}
								</Button>
							</div>
							<p className="text-center text-[10px] text-neutral-400">
								Laporan akan disimpan bersama konteks lingkungan dan analisis
								risiko.
							</p>
						</div>
					</form>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
