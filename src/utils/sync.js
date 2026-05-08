import { supabase } from './supabaseClient';

// Debounce to prevent hammering Supabase on every flashcard swipe
let syncTimeout = null;

function parseJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function pushCloudData() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // User not logged in, just do local

  const userId = session.user.id;

  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    try {
      // 1. Sync User Stats
      const streak = parseJSON(localStorage.getItem('gre_streak'), {});
      const daily = parseJSON(localStorage.getItem('gre_daily'), {});
      const now = new Date().toISOString();

      await supabase.from('user_stats').upsert({
        user_id: userId,
        streak_current: streak.current || 0,
        streak_last_date: streak.lastDate || null,
        daily_goal: daily.goal || 30,
        daily_count: daily.count || 0,
        daily_last_date: daily.date || null,
        updated_at: now
      });

      // 2. Sync User Words
      const progress = parseJSON(localStorage.getItem('gre_progress'), {});
      const bookmarks = parseJSON(localStorage.getItem('gre_bookmarks'), []);
      const favs = parseJSON(localStorage.getItem('gre_favourites'), []);

      const rows = [];
      for (const [word, data] of Object.entries(progress)) {
        // Only sync words that have actual interaction to save DB space
        if (data.reviewCount > 0 || bookmarks.includes(word) || favs.includes(word)) {
          rows.push({
            user_id: userId,
            word: word,
            score: data.score || 0,
            correct_count: data.correctCount || 0,
            incorrect_count: data.incorrectCount || 0,
            review_count: data.reviewCount || 0,
            last_reviewed: data.lastReviewed || null,
            next_review: data.nextReview || null,
            interval: data.interval || 1,
            learning_stage: data.learningStage || 'new',
            is_bookmarked: bookmarks.includes(word),
            is_favourite: favs.includes(word),
            updated_at: now
          });
        }
      }

      // Upsert rows in batches if there are many
      if (rows.length > 0) {
        const { error } = await supabase.from('user_words').upsert(rows);
        if (error) console.error('Cloud Sync Error (Words):', error.message);
      }

      // 3. Sync Daily Word Progress History
      const dailyHistory = parseJSON(localStorage.getItem('gre_daily_words'), {});
      const dailyRows = Object.entries(dailyHistory).map(([date, row]) => ({
        user_id: userId,
        day_date: date,
        words_done: Math.max(0, row?.count || 0),
        daily_goal: Math.max(1, row?.goal || 30),
        updated_at: row?.updatedAt || now,
      }));
      if (dailyRows.length > 0) {
        const { error } = await supabase.from('user_daily_words').upsert(dailyRows);
        if (error) console.error('Cloud Sync Error (Daily):', error.message);
      }
    } catch (err) {
      console.error('Failed to sync to cloud', err);
    }
  }, 1000); // 1 second debounce
}

export async function fetchCloudData(userId) {
  try {
    // 1. Fetch Stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (stats?.user_id) {
      localStorage.setItem('gre_streak', JSON.stringify({ current: stats.streak_current, lastDate: stats.streak_last_date }));
      localStorage.setItem('gre_daily', JSON.stringify({ count: stats.daily_count, goal: stats.daily_goal, date: stats.daily_last_date }));
    }

    // 2. Fetch Words
    const { data: words } = await supabase
      .from('user_words')
      .select('*')
      .eq('user_id', userId);

    if (Array.isArray(words)) {
      const progress = {};
      const bookmarks = [];
      const favs = [];

      for (const row of words) {
        progress[row.word] = {
          score: row.score,
          correctCount: row.correct_count,
          incorrectCount: row.incorrect_count,
          reviewCount: row.review_count,
          lastReviewed: row.last_reviewed,
          nextReview: row.next_review,
          interval: row.interval,
          learningStage: row.learning_stage
        };
        if (row.is_bookmarked) bookmarks.push(row.word);
        if (row.is_favourite) favs.push(row.word);
      }

      localStorage.setItem('gre_progress', JSON.stringify(progress));
      localStorage.setItem('gre_bookmarks', JSON.stringify(bookmarks));
      localStorage.setItem('gre_favourites', JSON.stringify(favs));
    }

    // 3. Fetch Daily Word History
    const { data: dailyRows } = await supabase
      .from('user_daily_words')
      .select('*')
      .eq('user_id', userId);

    if (Array.isArray(dailyRows)) {
      const history = {};
      for (const row of dailyRows) {
        history[row.day_date] = {
          count: Math.max(0, row.words_done || 0),
          goal: Math.max(1, row.daily_goal || 30),
          updatedAt: row.updated_at || new Date().toISOString(),
        };
      }
      localStorage.setItem('gre_daily_words', JSON.stringify(history));
    }
  } catch (err) {
    console.error('Failed to pull from cloud', err);
  }
}

export async function wipeCloudData(userId) {
  try {
    await Promise.all([
      supabase.from('user_stats').delete().eq('user_id', userId),
      supabase.from('user_words').delete().eq('user_id', userId),
      supabase.from('user_daily_words').delete().eq('user_id', userId),
    ]);
  } catch (err) {
    console.error('Failed to wipe cloud data', err);
  }
}
