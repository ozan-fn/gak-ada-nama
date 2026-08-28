import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const ACCOUNT_ID = process.env.ACCOUNT_ID!;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.BUCKET_NAME!;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|png|webp|gif);base64,/.test(value);
}

/**
 * Uploads a base64 data URL image to the "prita" R2 bucket and returns its
 * public URL. Throws if the value is not a base64 image or upload fails.
 */
export async function uploadImageDataUrl(dataUrl: string): Promise<string> {
  if (!PUBLIC_URL) {
    throw new Error(
      "R2_PUBLIC_URL belum di-set: URL publik bucket R2 diperlukan untuk menyimpan/gambar report.",
    );
  }

  const mime = /^data:(image\/\w+);base64,(.*)$/s.exec(dataUrl);
  if (!mime) {
    throw new Error("Gambar bukan base64 data URL yang valid.");
  }

  const [, contentType, base64] = mime;
  const ext = EXT_BY_MIME[contentType] ?? "jpg";
  const key = `reports/${randomUUID()}.${ext}`;

  const body = Buffer.from(base64, "base64");
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${PUBLIC_URL}/${key}`;
}

export async function deleteObjectByUrl(url: string): Promise<void> {
  const prefix = `${PUBLIC_URL}/`;
  if (!url.startsWith(prefix)) return;
  const key = url.slice(prefix.length);
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}