import { Job, Worker } from "bullmq";
import { redis } from "../lib/redis";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { VideoJobData } from "../lib/types";

const connection = redis;
const uploadsDir = path.join(process.cwd(), "public", "uploads");
const outputDir = path.join(process.cwd(), "public", "output_final");
const templatePath = path.join(process.cwd(), "public", "template.png");
const uploadTtlHours = Number(process.env.UPLOAD_TTL_HOURS ?? "24");
const deleteUploadsAfterProcessing = process.env.DELETE_UPLOAD_AFTER_PROCESSING !== "false";

interface VideoJob extends Job<VideoJobData, boolean, string> {}

function resolvePath(inputPath: string, baseDir: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.join(baseDir, inputPath);
}

function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn("⚠️ Falha ao apagar arquivo:", filePath, err);
    }
  }
}

function cleanupOldUploads(): void {
  if (uploadTtlHours <= 0 || !fs.existsSync(uploadsDir)) {
    return;
  }

  const now = Date.now();
  const maxAge = uploadTtlHours * 3600 * 1000;
  const removed: string[] = [];

  for (const fileName of fs.readdirSync(uploadsDir)) {
    const filePath = path.join(uploadsDir, fileName);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) continue;
    if (now - stat.mtimeMs > maxAge) {
      deleteFile(filePath);
      removed.push(fileName);
    }
  }

  if (removed.length) {
    console.log(`🧹 Limpeza de uploads antigos: ${removed.length} arquivo(s) removidos`);
  }
}

function getDuration(inputPath: string): number {
  const ffprobeBinary = process.env.FFPROBE_PATH || "ffprobe";
  const output = execSync(
    `${ffprobeBinary} -i "${inputPath}" -show_entries format=duration -v quiet -of csv=\"p=0\"`
  );

  return parseFloat(output.toString()) || 0;
}

function runFfmpeg(
  job: VideoJob,
  inputPath: string,
  outputPath: string,
  musicPath?: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const resolvedInputPath = resolvePath(inputPath, uploadsDir);
    const resolvedOutputPath = resolvePath(outputPath, outputDir);
    const resolvedMusicPath = musicPath ? resolvePath(musicPath, process.cwd()) : undefined;
    const hasMusic = !!resolvedMusicPath && fs.existsSync(resolvedMusicPath);

    if (!fs.existsSync(resolvedInputPath)) {
      reject(new Error(`❌ Vídeo de entrada não encontrado: ${resolvedInputPath}`));
      return;
    }

    if (!fs.existsSync(templatePath)) {
      reject(new Error(`❌ Template não encontrado: ${templatePath}`));
      return;
    }

    if (!fs.existsSync(path.dirname(resolvedOutputPath))) {
      fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
    }

    const ffmpegBinary = process.env.FFMPEG_PATH || "ffmpeg";
    ffmpeg.setFfmpegPath(ffmpegBinary);
    if (process.env.FFPROBE_PATH) {
      ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
    }


const command = ffmpeg(resolvedInputPath)
  .input(templatePath)
.complexFilter([
  "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280[base]",
  "[1:v]scale=720:1280[overlay]",
  "[base][overlay]overlay=0:0[out]",
])
.outputOptions([
  "-map",
  "[out]",
  "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
  ])
  .output(resolvedOutputPath);

    if (hasMusic && resolvedMusicPath) {
      command.input(resolvedMusicPath).outputOptions([
        "-map",
        "2:a:0",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-shortest",
      ]);
    }

    const duration = getDuration(resolvedInputPath);

    command
      .on("progress", (progress: { percent?: number }) => {
        const percent = progress.percent ?? 0;
        const safePercent = Number.isFinite(percent) ? Math.min(100, Math.max(0, Math.floor(percent))) : 0;
        job.updateProgress(safePercent).catch(() => {});
      })
      .on(
        "error",
        (err: Error, stdout: string | null, stderr: string | null) => {
          reject(new Error(`ffmpeg error: ${err.message}\n${stderr ?? stdout ?? ""}`));
        }
      )
      .on("end", () => {
        if (duration > 0) {
          job.updateProgress(100).catch(() => {});
        }
        resolve(true);
      })
      .run();
  });
}

const worker = new Worker<VideoJobData, boolean, string>(
  "video",
  async (job) => {
    cleanupOldUploads();

    const { uuid, inputPath: rawInputPath, outputPath: rawOutputPath, musicPath, deleteUploadedSource } = job.data ?? {};
    const shouldDeleteSource = deleteUploadsAfterProcessing && deleteUploadedSource !== false;

    console.log("🔥 JOB CHEGOU:", job.id);
    await job.updateProgress(10);

    let resolvedInput = rawInputPath ? resolvePath(rawInputPath, uploadsDir) : undefined;
    let resolvedOutput = rawOutputPath ? resolvePath(rawOutputPath, outputDir) : undefined;

    if (!resolvedInput && uuid) {
      const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
      const fileName = files.find((file) =>
        file.includes(uuid) && (file.endsWith(".webm") || file.endsWith(".mp4"))
      );

      if (!fileName) {
        throw new Error(`❌ Vídeo não encontrado para uuid: ${uuid}`);
      }

      resolvedInput = path.join(uploadsDir, fileName);
    }

    if (!resolvedInput) {
      throw new Error("❌ Nenhum caminho de entrada fornecido para o job");
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!resolvedOutput) {
      resolvedOutput = path.join(outputDir, `${uuid || job.id}_final.mp4`);
    }

    console.log("🎬 Processando:", resolvedInput);
    await job.updateProgress(20);

    await runFfmpeg(job, resolvedInput, resolvedOutput, musicPath);

    const fileExists = fs.existsSync(resolvedOutput);
    if (!fileExists) {
      throw new Error(`Arquivo não apareceu em tempo: ${resolvedOutput}`);
    }

    const stats = fs.statSync(resolvedOutput);
    if (stats.size < 1000) {
      throw new Error(`Arquivo inválido: ${resolvedOutput} (${stats.size} bytes)`);
    }

    if (shouldDeleteSource && resolvedInput.startsWith(uploadsDir) && resolvedInput !== resolvedOutput) {
      deleteFile(resolvedInput);
      console.log("🧹 Upload removido após processamento:", resolvedInput);
    }

    await job.updateProgress(100);
    console.log("✅ Video pronto:", resolvedOutput);
    return true;
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log("🎉 Job concluído:", job.id);
});

worker.on("failed", (job, err) => {
  console.error("❌ Job erro:", job?.id, err);
});

console.log("🚀 Worker BullMQ online");
