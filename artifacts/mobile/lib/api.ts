import { supabase } from '@/lib/supabase';
import { Strategy, StrategyStage, Trade } from '@/types';

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const API_BASE = domain
  ? `https://${domain}/api-server/api`
  : 'http://localhost:3000/api';

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function setApiTokenGetter(fn: TokenGetter) {
  getToken = fn;
}

async function request(method: string, path: string, body?: unknown) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  // Profile
  getProfile: () => request('GET', '/user/profile'),
  putProfile: (data: { initialBalance: number; language: string }) =>
    request('PUT', '/user/profile', data),

  // Trades
  getTrades: () => request('GET', '/trades'),
  postTrade: (trade: unknown) => request('POST', '/trades', trade),
  putTrade: (id: string, trade: unknown) => request('PUT', `/trades/${id}`, trade),
  deleteTrade: (id: string) => request('DELETE', `/trades/${id}`),

  // Legacy Strategies List
  getStrategies: () => request('GET', '/strategies'),
  postStrategy: (name: string) => request('POST', '/strategies', { name }),
  deleteStrategy: (name: string) =>
    request('DELETE', `/strategies/${encodeURIComponent(name)}`),

  // -------------------------------------------------------------
  // 🌟 النظام الجديد: الاستراتيجيات والمراحل في Supabase المباشر
  // -------------------------------------------------------------
  
  /** جلب الاستراتيجية النشطة للمستخدم من Supabase */
  async getActiveStrategyCloud(): Promise<Strategy | null> {
    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        name: 'Custom Strategy',
        initialBalance: Number(data.initial_balance),
        targetAmount: Number(data.target_balance),
        months: Math.round(Number(data.duration_days) / 30) || 1,
        stagesCount: Number(data.total_stages) || 5,
        growthPerStage: 0,
        status: data.is_active ? 'active' : 'archived',
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  },

  /** حفظ استراتيجية جديدة في Supabase */
  async createStrategyCloud(strategyData: {
    initialBalance: number;
    targetBalance: number;
    durationDays: number;
    totalStages: number;
  }): Promise<string | null> {
    try {
      // تعطيل أي استراتيجية سابقة
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      await supabase
        .from('strategies')
        .update({ is_active: false })
        .eq('user_id', userData.user.id);

      // إضافة الاستراتيجية الجديدة
      const { data, error } = await supabase
        .from('strategies')
        .insert({
          user_id: userData.user.id,
          initial_balance: strategyData.initialBalance,
          target_balance: strategyData.targetBalance,
          duration_days: strategyData.durationDays,
          total_stages: strategyData.totalStages,
          is_active: true,
        })
        .select()
        .single();

      if (error || !data) return null;
      return data.id;
    } catch {
      return null;
    }
  },

  /** جلب مراحل استراتيجية معينة من Supabase */
  async getStagesCloud(strategyId: string): Promise<StrategyStage[]> {
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('stage_number', { ascending: true });

      if (error || !data) return [];

      return data.map((st) => ({
        id: st.id,
        strategyId: st.strategy_id,
        stageNumber: Number(st.stage_number),
        targetBalance: Number(st.target_amount),
        startingBalance: 0,
        status: st.is_completed ? 'completed' : 'pending',
        completedAt: st.completed_at,
      }));
    } catch {
      return [];
    }
  },

    /** حذف حساب المستخدم وجميع بياناته من Supabase */
  async deleteAccountCloud(): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const userId = userData.user.id;

      // 1. حذف البيانات المرتبطة بالجداول
      await supabase.from('trades').delete().eq('user_id', userId);
      await supabase.from('stages').delete().eq('user_id', userId);
      await supabase.from('strategies').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);

      // 2. تسجيل الخروج وتصفية الجلسة
      await supabase.auth.signOut();

      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  },


  // Sync
  sync: (payload: {
    trades: unknown[];
    strategies: string[];
    initialBalance: number;
    language: string;
  }) => request('POST', '/sync', payload),
};
