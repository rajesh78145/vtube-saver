const supabase = require("../config/supabase");
const logger = require("../utils/logger");

const MAX_HISTORY = parseInt(process.env.MAX_HISTORY) || 50;

const addRecord = async (userId, data) => {
  const record = {
    user_id: userId,
    title: data.title || "Unknown",
    thumbnail: data.thumbnail || null,
    platform: data.platform || "Unknown",
    type: data.type || "video",
    quality: data.quality || "unknown",
    duration: data.duration ? Math.round(parseFloat(data.duration)) : null,
    filesize: data.filesize || null,
  };

  try {
    const { error: insertError } = await supabase
      .from("download_history")
      .insert(record);

    if (insertError) {
      logger.error("History insert error:", insertError);
      throw insertError;
    }

    const { data: records, error: selectError } = await supabase
      .from("download_history")
      .select("id")
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false });

    if (selectError) throw selectError;

    if (records.length > MAX_HISTORY) {
      const idsToDelete = records.slice(MAX_HISTORY).map((r) => r.id);
      const { error: deleteError } = await supabase
        .from("download_history")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) throw deleteError;
    }
  } catch (err) {
    logger.error("Failed to save download history:", err);
  }
};

const getHistory = async (userId) => {
  const { data, error } = await supabase
    .from("download_history")
    .select("*")
    .eq("user_id", userId)
    .order("downloaded_at", { ascending: false })
    .limit(MAX_HISTORY);

  if (error) throw error;
  return data;
};

const deleteRecord = async (userId, recordId) => {
  const { error } = await supabase
    .from("download_history")
    .delete()
    .eq("id", recordId)
    .eq("user_id", userId);

  if (error) throw error;
  return { message: "Record deleted" };
};

module.exports = { addRecord, getHistory, deleteRecord };
