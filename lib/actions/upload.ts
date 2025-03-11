"use server";

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { ActionError, assertAdmin } from "@/lib/server/auth";
import { runAction } from "@/lib/server/action";

const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads an image to Cloudinary. Needs CLOUDINARY_URL to be set on the server. */
export async function uploadImage(formData: FormData) {
  return runAction<{ url: string }>(async () => {
    await assertAdmin();
    if (!cloudinary.config().cloud_name) {
      throw new ActionError("Image uploads aren't set up (CLOUDINARY_URL missing). Paste an image link instead.");
    }
    const file = formData.get("file");
    if (!(file instanceof File)) throw new ActionError("No file received.");
    if (!file.type.startsWith("image/")) throw new ActionError("Only images can be uploaded.");
    if (file.size > MAX_BYTES) throw new ActionError("Images must be under 8 MB.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "codevents", upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined },
          (error, res) => (error ? reject(error) : resolve(res))
        )
        .end(buffer);
    });
    if (!result) throw new ActionError("Upload failed.");
    return { data: { url: result.secure_url } };
  });
}
