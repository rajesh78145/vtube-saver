const crypto = require("crypto");
const videoService = require("../services/videoService");
const historyService = require("../services/historyService");
const logger = require("../utils/logger");

const info = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url)
      throw Object.assign(new Error("URL is required"), { status: 400 });
    const metadata = await videoService.getInfo(url);
    res.json({ success: true, data: metadata });
  } catch (err) {
    next(err);
  }
};

const download = async (req, res, next) => {
  const downloadId = req.body.downloadId || crypto.randomUUID();
  try {
    const { url, formatId } = req.body;
    if (!url || !formatId)
      throw Object.assign(new Error("URL and formatId are required"), {
        status: 400,
      });

    const userId = req.user.id;
    const {
      filePath,
      title,
      ext,
      thumbnail,
      platform,
      type,
      quality,
      duration,
      filesize,
    } = await videoService.download(
      url,
      formatId,
      downloadId,
      userId,
      (progress) => {
        logger.info(`Download ${downloadId}: ${progress.percent}%`);
      },
    );

    res.download(filePath, `${title}.${ext}`, (err) => {
      if (err) logger.error("File send error:", err);
      videoService.cleanupDownload(downloadId);
      historyService
        .addRecord(userId, {
          title,
          thumbnail,
          platform,
          type,
          quality,
          duration,
          filesize,
        })
        .catch((e) => logger.error("History save error:", e));
    });
  } catch (err) {
    videoService.cleanupDownload(downloadId);
    next(err);
  }
};
const cancel = async (req, res, next) => {
  try {
    const { downloadId } = req.params;
    const cancelled = videoService.cancelDownload(downloadId);
    if (cancelled) {
      res.json({ success: true, message: "Download cancelled" });
    } else {
      res.status(404).json({
        success: false,
        message: "Download not found or already completed",
      });
    }
  } catch (err) {
    next(err);
  }
};
module.exports = { info, download, cancel };
