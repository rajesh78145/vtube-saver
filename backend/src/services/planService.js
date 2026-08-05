const supabase = require("../config/supabase");

const getPlans = async () => {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) throw error;
  return data;
};

const upgradePlan = async (userId, planId) => {
  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (!plan) throw Object.assign(new Error("Plan not found"), { status: 404 });

  const planExpire = plan.duration_days
    ? new Date(
        Date.now() + plan.duration_days * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null;

  const { data, error } = await supabase
    .from("users")
    .update({
      plan_id: planId,
      plan_expire: planExpire,
      today_download_count: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, plan_id, plan_expire, today_download_count")
    .single();

  if (error) throw error;
  return { plan: plan.name, planExpire, ...data };
};

module.exports = { getPlans, upgradePlan };
