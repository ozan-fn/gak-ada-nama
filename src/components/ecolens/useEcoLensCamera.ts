import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_ECO_LENS_IMAGE_BYTES } from "@/types/ecolens";

export type CameraStatus = "idle" | "requesting" | "live" | "error";

type CameraStartResult =
	| { success: true }
	| { success: false; message: string };

function getDataUrlByteLength(dataUrl: string): number {
	const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
	const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
	return Math.floor((encoded.length * 3) / 4) - padding;
}

function describeCameraError(error: unknown): string {
	if (!(error instanceof DOMException)) {
		return "Kamera tidak dapat diaktifkan. Periksa perangkat lalu coba lagi.";
	}

	if (error.name === "NotAllowedError" || error.name === "SecurityError") {
		return "Izin kamera ditolak. Izinkan akses kamera melalui pengaturan browser lalu coba lagi.";
	}

	if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
		return "Kamera tidak ditemukan pada perangkat ini.";
	}

	if (error.name === "NotReadableError" || error.name === "TrackStartError") {
		return "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.";
	}

	return "Kamera tidak dapat diaktifkan. Periksa perangkat lalu coba lagi.";
}

function shouldSkipFallback(error: unknown): boolean {
	return (
		error instanceof DOMException &&
		(error.name === "NotAllowedError" || error.name === "SecurityError")
	);
}

export function useEcoLensCamera() {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const mountedRef = useRef(false);
	const [status, setStatus] = useState<CameraStatus>("idle");
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const releaseStream = useCallback(() => {
		streamRef.current?.getTracks().forEach((track) => {
			track.stop();
		});
		streamRef.current = null;

		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
			releaseStream();
		};
	}, [releaseStream]);

	const stopCamera = useCallback(() => {
		releaseStream();
		setIsReady(false);
		setStatus("idle");
	}, [releaseStream]);

	const startCamera = useCallback(async (): Promise<CameraStartResult> => {
		releaseStream();
		setError(null);
		setIsReady(false);
		setStatus("requesting");

		if (!window.isSecureContext) {
			const message = "Kamera hanya tersedia melalui HTTPS atau localhost.";
			setError(message);
			setStatus("error");
			return { success: false, message };
		}

		if (!navigator.mediaDevices?.getUserMedia) {
			const message = "Browser ini tidak mendukung akses kamera.";
			setError(message);
			setStatus("error");
			return { success: false, message };
		}

		let stream: MediaStream;

		try {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					audio: false,
					video: {
						facingMode: { ideal: "environment" },
						width: { ideal: 1920 },
						height: { ideal: 1080 },
					},
				});
			} catch (preferredCameraError) {
				if (shouldSkipFallback(preferredCameraError)) {
					throw preferredCameraError;
				}

				stream = await navigator.mediaDevices.getUserMedia({
					audio: false,
					video: true,
				});
			}

			if (!mountedRef.current) {
				stream.getTracks().forEach((track) => {
					track.stop();
				});
				return {
					success: false,
					message: "Halaman kamera sudah ditutup.",
				};
			}

			streamRef.current = stream;

			if (!videoRef.current) {
				releaseStream();
				throw new Error("VIDEO_ELEMENT_UNAVAILABLE");
			}

			videoRef.current.srcObject = stream;
			await videoRef.current.play();

			if (mountedRef.current) {
				setStatus("live");
				setIsReady(
					videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
				);
			}

			return { success: true };
		} catch (cameraError) {
			releaseStream();
			const message = describeCameraError(cameraError);

			if (mountedRef.current) {
				setError(message);
				setStatus("error");
			}

			return { success: false, message };
		}
	}, [releaseStream]);

	const markVideoReady = useCallback(() => {
		if (videoRef.current?.videoWidth && videoRef.current.videoHeight) {
			setIsReady(true);
		}
	}, []);

	const captureFrame = useCallback((): string => {
		const video = videoRef.current;

		if (!video || !isReady || !video.videoWidth || !video.videoHeight) {
			throw new Error("CAMERA_NOT_READY");
		}

		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");

		if (!context) {
			throw new Error("CANVAS_UNAVAILABLE");
		}

		const maxDimensions = [1600, 1280, 1024];
		const qualityLevels = [0.8, 0.68, 0.56];

		for (const maxDimension of maxDimensions) {
			const scale = Math.min(
				1,
				maxDimension / Math.max(video.videoWidth, video.videoHeight),
			);

			canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
			canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			for (const quality of qualityLevels) {
				const dataUrl = canvas.toDataURL("image/jpeg", quality);

				if (getDataUrlByteLength(dataUrl) <= MAX_ECO_LENS_IMAGE_BYTES) {
					return dataUrl;
				}
			}
		}

		throw new Error("IMAGE_TOO_LARGE");
	}, [isReady]);

	return {
		videoRef,
		status,
		isReady,
		error,
		startCamera,
		stopCamera,
		captureFrame,
		markVideoReady,
	};
}
