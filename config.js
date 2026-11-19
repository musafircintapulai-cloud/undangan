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
  APPS_SCRIPT_URL: "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnQnM0fG8AEsUJoznqyyBpH51xjKlygW-qqdq0EneFm25hj3Z90sTweiXgfNdagcEnVQq8tzlFtvjBEZIPf-nJzRW0MbA06K9QD9i5kFkUGn-RJp0Z6pNKLLjzL8wE4HtGzLgDdPaAQBd9lo0kXoPl_XIG4vfciIHOFaHUZ-xVUslqKnblyjU8RtooiYJrPm6jPIsZ7pvbsMOieEkSIlz6SznRjsnaioAVKM_J3db7_XT2p5CAUulZafGgVGyPFuDjaUKfrjOnyPjrOhSqjq4IkmrLgPnA&lib=MclTPx2EV0K-nthVJjHW5Ej_jpFl-Glvw",

  // Alamat publik undangan (tanpa garis miring di akhir). Dipakai untuk membuat link tamu.
  // Contoh GitHub Pages: "https://username.github.io/undangan"
  BASE_URL: "https://GANTI-DENGAN-ALAMAT-SITUS-ANDA"
};
