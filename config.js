/**
 * config.js — konfigurasi frontend (aman dipublikasikan).
 * JANGAN pernah menaruh service_role key atau password admin di sini.
 */
window.CONFIG = {
  // Supabase: Project Settings > API > Project URL
  SUPABASE_URL: "https://fjgbwrgyamamqfkjxzus.supabase.co",

  // Supabase: Project Settings > API > anon / publishable key (BOLEH publik, dilindungi RLS)
  SUPABASE_ANON_KEY: "sb_publishable_zhkW9Yp3YdqUQm6fvJazzg_xIrEANJa",

  // Apps Script: Deploy > Web app > URL berakhiran /exec
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwcpiTHvBF4XTSXoOXEIoP5iLE7Fptk6vNdPok8bDyGs6LQiUBAjvUUTeTR7zgtjEm0/exec",

  // Alamat publik undangan (tanpa garis miring di akhir). Dipakai untuk membuat link tamu.
  // Contoh GitHub Pages: "https://username.github.io/undangan"
  BASE_URL: "https://musafircintapulai-cloud.github.io/undangan"
};
