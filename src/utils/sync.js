import { supabase } from './supabaseClient';

// Debounce to prevent hammering Supabase on every flashcard swipe
let syncTimeout = null;

export async function pushCloudData() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // User not logged in, just do local

  const userId = session.user.id;

  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    try {
      // 1. Sync User Stats
      const rawStreak = localStorage.getItem('gre_streak');
      const rawDaily = localStorage.getItem('gre_daily');
      
      const streak = rawStreak ? JSON.parse(rawStreak) : {};
      const daily = rawDaily ? JSON.parse(rawDaily) : {};

      await supabase.from('user_stats').upsert({
        user_id: userId,
        streak_current: streak.current || 0,
        streak_last_date: streak.lastDate || null,
        daily_goal: daily.goal || 30,
        daily_count: daily.count || 0,
        daily_last_date: daily.date || null,
        updated_at: new Date().toISOString()
      });

      // 2. Sync User Words
      const rawProgress = localStorage.getItem('gre_progress');
      const rawBookmarks = localStorage.getItem('gre_bookmarks');
      const rawFavs = localStorage.getItem('gre_favourites');
      
      const progress = rawProgress ? JSON.parse(rawProgress) : {};
      const bookmarks = rawBookmarks ? JSON.parse(rawBookmarks) : [];
      const favs = rawFavs ? JSON.parse(rawFavs) : [];

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
            updated_at: new Date().toISOString()
          });
        }
      }

      // Upsert rows in batches if there are many
      if (rows.length > 0) {
        const { error } = await supabase.from('user_words').upsert(rows);
        if (error) console.error('Cloud Sync Error (Words):', error.message);
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

    if (stats) {
      localStorage.setItem('gre_streak', JSON.stringify({ current: stats.streak_current, lastDate: stats.streak_last_date }));
      localStorage.setItem('gre_daily', JSON.stringify({ count: stats.daily_count, goal: stats.daily_goal, date: stats.daily_last_date }));
    }

    // 2. Fetch Words
    const { data: words } = await supabase
      .from('user_words')
      .select('*')
      .eq('user_id', userId);

    if (words && words.length > 0) {
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
  } catch (err) {
    console.error('Failed to pull from cloud', err);
  }
}

export async function wipeCloudData(userId) {
  try {
    await Promise.all([
      supabase.from('user_stats').delete().eq('user_id', userId),
      supabase.from('user_words').delete().eq('user_id', userId)
    ]);
  } catch (err) {
    console.error('Failed to wipe cloud data', err);
  }
}
