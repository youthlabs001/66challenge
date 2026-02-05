// 66challenge Supabase 연동 설정
// Supabase 대시보드 > Project Settings > API 에서 anon key를 복사해 아래에 붙여넣으세요.
window.SUPABASE_URL = 'https://qhwhhujhnhkfenofoewa.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFod2hodWpobmhrZmVub2ZvZXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTYxNjUsImV4cCI6MjA4NTc5MjE2NX0.4k6wb7Vz7GzDDoB3JwGKnoETodTk3o9A5b3ZPGyiscI';

(function () {
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    window.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }
})();
