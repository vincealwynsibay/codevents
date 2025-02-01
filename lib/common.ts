"use server";

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { uploadPreset } from "./cloudinary";

export async function uploadImage(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const uploadResult: UploadApiResponse | undefined = await new Promise(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            upload_preset: uploadPreset,
          },
          function (error, result) {
            if (error) {
              reject(error);
              return;
            }
            resolve(result);
          }
        )
        .end(buffer);
    }
  );
  return uploadResult;
}
