import { supabase } from './supabaseClient';

const SYNC_KEYS = [
  'gre_progress',
  'gre_streak',
  'gre_daily',
  'gre_bookmarks',
  'gre_sessions',
  'gre_game_scores',
];

// Gather local data into a JSON object
function getLocalDump() {
  const data = {};
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch (e) {
        console.warn(`Failed to parse ${key} for sync`, e);
      }
    }
  }
  return data;
}

// Debounce state to prevent hammering Supabase on every flashcard swipe
let syncTimeout = null;

export async function pushCloudData() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // User not logged in, just do local

  const payload = getLocalDump();

  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({ user_id: session.user.id, data: payload, updated_at: new Date().toISOString() });
      if (error) console.error('Cloud Sync Error:', error.message);
    } catch (err) {
      console.error('Failed to sync to cloud', err);
    }
  }, 2000); // 2 second debounce
}

export async function fetchCloudData(userId) {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Fetch Cloud Data Error:', error.message);
      return;
    }

    if (data && data.data) {
      const cloudData = data.data;
      for (const key of SYNC_KEYS) {
        if (cloudData[key] !== undefined) {
          localStorage.setItem(key, JSON.stringify(cloudData[key]));
        }
      }
    }
  } catch (err) {
    console.error('Failed to pull from cloud', err);
  }
}
