import ffmpeg from "fluent-ffmpeg";

export function runFfmpeg(input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .videoCodec("libx264")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}
