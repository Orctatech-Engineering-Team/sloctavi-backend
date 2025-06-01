import type buffer from "node:buffer";

export interface MediaStorage {
  uploadFile: (
    userId: string,
    fileName: string,
    fileBuffer: buffer.Buffer,
    context: "profile_image" | "service_image"
  ) => Promise<string>; // returns public URL or path
}
