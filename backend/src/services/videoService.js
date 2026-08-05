const ytDlp = require("yt-dlp-exec");
const path = require("path");
const fs = require("fs");
const cache = require("../utils/cache");
const logger = require("../utils/logger");
const supabase = require("../config/supabase");

const tempDir = path.join(__dirname, "..", "..", "temp");
const activeDownloads = new Map();
const downloadingUsers = new Set();
const MAX_FILENAME = parseInt(process.env.MAX_FILENAME_LENGTH) || 100;

const sanitizeFilename = (name) => {
  const replacements = {
    "<": "＜",
    ">": "＞",
    ":": "：",
    '"': "＂",
    "/": "／",
    "\\": "＼",
    "|": "｜",
    "?": "？",
    "*": "＊",
  };
  let clean = name;
  for (const [char, replacement] of Object.entries(replacements)) {
    clean = clean.replaceAll(char, replacement);
  }
  if (clean.length > MAX_FILENAME) {
    clean = clean.substring(0, MAX_FILENAME);
  }
  return clean;
};

const friendlyRes = (res) => {
  if (!res) return res;
  if (/^\d+p$/i.test(res)) return res;
  const parts = res.split("x");
  if (parts.length === 2) {
    const height = parseInt(parts[1], 10);
    if (height) return `${height}p`;
  }
  return res;
};

const estimateSize = (bitrate, durationSec) => {
  if (!bitrate || !durationSec) return null;
  return Math.round((bitrate * 1000 * durationSec) / 8);
};

const getInfo = async (url) => {
  const cached = cache.get(url);
  if (cached) return cached;

  try {
    const cookiePath = path.join(process.cwd(), "cookies.txt");

    console.log("CWD:", process.cwd());
    console.log("Cookie path:", cookiePath);
    console.log("Cookie exists:", fs.existsSync(cookiePath));

    if (fs.existsSync(cookiePath)) {
      console.log("Cookie size:", fs.statSync(cookiePath).size);
    }
    const { execSync } = require("child_process");

    try {
      console.log(
        execSync(
          path.join(
            process.cwd(),
            "node_modules",
            "yt-dlp-exec",
            "bin",
            "yt-dlp",
          ) + " --version",
        ).toString(),
      );
    } catch (e) {
      console.log(e.message);
    }
    const { execFileSync } = require("child_process");

    const output = execFileSync(
      path.join(process.cwd(), "node_modules", "yt-dlp-exec", "bin", "yt-dlp"),
      [
        url,
        "--dump-single-json",
        "--no-warnings",
        "--no-check-certificate",
        "--cookies",
        cookiePath,
        "--extractor-args",
        "youtube:player_client=android",
      ],
      {
        encoding: "utf8",
      },
    );

    const info = JSON.parse(output);

    const allFormats = info.formats || [];
    const videoFormats = allFormats.filter(
      (f) => f.vcodec !== "none" && f.resolution !== "audio only",
    );
    const audioFormats = allFormats.filter(
      (f) => f.acodec !== "none" && f.vcodec === "none",
    );
    const bestAudio = audioFormats.sort(
      (a, b) => (b.tbr || 0) - (a.tbr || 0),
    )[0];

    const resolutionMap = new Map();
    for (const f of videoFormats) {
      const res = f.resolution || "unknown";
      if (!resolutionMap.has(res)) resolutionMap.set(res, []);
      resolutionMap.get(res).push(f);
    }

    const formats = [];

    for (const [res, formatsAtRes] of resolutionMap) {
      formatsAtRes.sort((a, b) => (b.tbr || 0) - (a.tbr || 0));
      const best = formatsAtRes[0];

      if (best.acodec !== "none") {
        formats.push({
          format_id: best.format_id,
          type: "video",
          resolution: friendlyRes(res),
          fps: best.fps || null,
          ext: best.ext,
          filesize: best.filesize || estimateSize(best.tbr, info.duration),
          tbr: best.tbr,
          needsMerge: false,
          label: `${friendlyRes(res)}${best.fps && best.fps > 30 ? ` ${best.fps}fps` : ""}`,
        });
      } else if (bestAudio) {
        const videoBitrate = best.tbr || 0;
        const audioBitrate = bestAudio.tbr || 0;
        const estimatedSize =
          best.filesize && bestAudio.filesize
            ? best.filesize + bestAudio.filesize
            : estimateSize(videoBitrate + audioBitrate, info.duration);

        formats.push({
          format_id: `${best.format_id}+bestaudio`,
          type: "video",
          resolution: friendlyRes(res),
          fps: best.fps || null,
          ext: "mp4",
          filesize: estimatedSize,
          tbr: videoBitrate + audioBitrate,
          needsMerge: true,
          label: `${friendlyRes(res)}${best.fps && best.fps > 30 ? ` ${best.fps}fps` : ""}`,
        });
      }
    }

    for (const audio of audioFormats) {
      const bitrate = audio.tbr ? `${Math.round(audio.tbr)}k` : "";
      const ext = audio.ext?.toUpperCase() || "audio";
      const filesize = audio.filesize || estimateSize(audio.tbr, info.duration);

      formats.push({
        format_id: audio.format_id,
        type: "audio",
        resolution: "audio",
        fps: null,
        ext: audio.ext,
        filesize,
        tbr: audio.tbr,
        needsMerge: false,
        label: `${ext} ${bitrate}`.trim(),
      });
    }

    const metadata = {
      title: info.title,
      thumbnail: info.thumbnail,
      platform: info.extractor_key || "unknown",
      duration: info.duration,
      formats,
    };

    cache.set(url, metadata);
    return metadata;
  } catch (error) {
    console.log("============== ERROR ==============");
    console.log("message:", error.message);
    console.log("stderr:", error.stderr);
    console.log("stdout:", error.stdout);
    console.log("stack:", error.stack);
    console.log("==================================");

    let message = "Failed to fetch video info";
    const stderr = error.stderr || "";
    if (stderr) {
      const s = stderr.toLowerCase();
      if (s.includes("private video")) message = "This video is private";
      else if (s.includes("video unavailable")) message = "Video not available";
      else if (s.includes("unsupported url"))
        message = "Unsupported platform or URL";
      else if (s.includes("sign in")) message = "This video requires login";
      else if (s.includes("not a valid url")) message = "Invalid URL";
    }

    throw Object.assign(new Error(message), { status: 400 });
  }
};

const checkAndIncrementLimit = async (userId) => {
  const { data: user } = await supabase
    .from("users")
    .select("plan_id, today_download_count, last_download_date")
    .eq("id", userId)
    .single();

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const { data: plan } = await supabase
    .from("plans")
    .select("daily_limit")
    .eq("id", user.plan_id)
    .single();

  if (!plan) throw Object.assign(new Error("Plan not found"), { status: 500 });

  const dailyLimit = plan.daily_limit;
  const today = new Date().toISOString().slice(0, 10);
  let count = user.today_download_count;
  const lastDate = user.last_download_date
    ? user.last_download_date.slice(0, 10)
    : null;

  if (lastDate !== today) count = 0;
  if (count >= dailyLimit) {
    throw Object.assign(
      new Error("Daily download limit reached. Please upgrade your plan."),
      { status: 429 },
    );
  }

  const newCount = count + 1;
  const { error } = await supabase
    .from("users")
    .update({ today_download_count: newCount, last_download_date: today })
    .eq("id", userId);

  if (error) throw error;
  return newCount;
};

const download = async (url, formatId, downloadId, userId, onProgress) => {
  await checkAndIncrementLimit(userId);

  const metadata = await getInfo(url);
  const format = metadata.formats.find((f) => f.format_id === formatId);
  if (!format)
    throw Object.assign(new Error("Invalid format selected"), { status: 400 });

  const baseName = sanitizeFilename(metadata.title);
  const downloadDir = path.join(tempDir, downloadId);
  if (!fs.existsSync(downloadDir))
    fs.mkdirSync(downloadDir, { recursive: true });

  const outputTemplate = path.join(downloadDir, `${baseName}.%(ext)s`);

  const ytOpts = {
    format: formatId,
    output: outputTemplate,
    mergeOutputFormat: "mp4",
    noWarnings: true,
    noCheckCertificate: true,
    cookies: path.join(process.cwd(), "cookies.txt"),
  };
  const subprocess = ytDlp.exec(url, ytOpts);
  activeDownloads.set(downloadId, subprocess);
  let lastPercent = -1;

  if (subprocess.stdout) {
    subprocess.stdout.on("data", (data) => {
      const output = data.toString();
      const match = output.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (match) {
        const percent = parseFloat(match[1]);
        if (percent !== lastPercent) {
          lastPercent = percent;
          if (onProgress) onProgress({ percent });
        }
      }
    });
  }

  return new Promise((resolve, reject) => {
    let stderr = "";
    if (subprocess.stderr) {
      subprocess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    subprocess.on("close", (code) => {
      activeDownloads.delete(downloadId);
      if (code !== 0) {
        const msg = stderr || "Download failed";
        logger.error("yt-dlp download error:", msg);
        reject(new Error(msg));
        return;
      }
      const files = fs.readdirSync(downloadDir);
      if (files.length === 0) {
        reject(new Error("No file downloaded"));
        return;
      }
      const finalFile = path.join(downloadDir, files[0]);
      resolve({
        filePath: finalFile,
        title: metadata.title,
        ext: path.extname(finalFile).slice(1),
        thumbnail: metadata.thumbnail,
        platform: metadata.platform,
        type: format.type,
        quality: format.resolution,
        duration: metadata.duration,
        filesize: format.filesize,
      });
    });

    subprocess.on("error", (err) => {
      logger.error("yt-dlp download error:", err);
      reject(err);
    });
  });
};
const cancelDownload = (downloadId) => {
  const subprocess = activeDownloads.get(downloadId);
  if (subprocess) {
    subprocess.kill();
    activeDownloads.delete(downloadId);
    cleanupDownload(downloadId);
    return true;
  }
  return false;
};
const cleanupDownload = (downloadId) => {
  const dir = path.join(tempDir, downloadId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

module.exports = { getInfo, download, cleanupDownload, cancelDownload };
