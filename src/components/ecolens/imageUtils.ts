import { MAX_ECO_LENS_IMAGE_BYTES } from "#/types/ecolens";

export function processUploadedImage(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!file.type.startsWith("image/")) {
			reject(new Error("Format file harus berupa gambar (JPG, PNG, WebP, dll)."));
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Gagal memproses gambar."));
					return;
				}

				const maxDimensions = [1600, 1280, 1024];
				const qualityLevels = [0.82, 0.7, 0.58];

				for (const maxDim of maxDimensions) {
					const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
					canvas.width = Math.max(1, Math.round(img.width * scale));
					canvas.height = Math.max(1, Math.round(img.height * scale));
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

					for (const quality of qualityLevels) {
						const dataUrl = canvas.toDataURL("image/jpeg", quality);
						const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
						const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
						const byteLength = Math.floor((encoded.length * 3) / 4) - padding;

						if (byteLength <= MAX_ECO_LENS_IMAGE_BYTES) {
							resolve(dataUrl);
							return;
						}
					}
				}

				reject(
					new Error(
						"Ukuran foto terlalu besar. Silakan pilih foto dengan resolusi lebih kecil.",
					),
				);
			};
			img.onerror = () => reject(new Error("Gagal memuat file gambar."));
			img.src = reader.result as string;
		};
		reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
		reader.readAsDataURL(file);
	});
}
