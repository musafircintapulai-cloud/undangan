/* Konten contoh — dipakai undangan (index.html) dan admin saat database masih kosong */
window.DEFAULT_CONTENT = {
  meta: { title: 'The Wedding of Alexander & Isabella', description: 'Undangan pernikahan Alexander & Isabella', baseUrl: '' },
  theme: { colors: { primary: '#4A0E22', secondary: '#9C5B70', accent: '#F26B6B', bg: '#FFFFFF', card: '#F3EDE4', text: '#3A2A2A' },
    fonts: { script: 'Pinyon Script', heading: 'Cormorant Garamond', body: 'Inter' }, assets: {} },
  music: { enabled: false, autoplay: true, tracks: [] },
  wa: { template: "Halo {nama},\n\nKami mengundang Anda ke pernikahan kami. Buka undangan digital di sini:\n{link}\n\nTerima kasih 🙏" },
  intro: { enabled: true, videoUrl: '', showSkip: true },
  background: { type: 'none', imageUrl: '', videoUrl: '', overlay: 0.55 },
  sections: [
    { id: 'cover', type: 'cover', enabled: true, data: {} },
    { id: 'couple', type: 'couple', enabled: true, data: { intro: 'Bergabunglah bersama kami dalam pernikahan', groom: 'Alexander', bride: 'Isabella', date: 'Sabtu, 12 Juni 2027', place: 'Jakarta, Indonesia' } },
    { id: 'story', type: 'polaroid', enabled: true, data: { photos: [{ url: '', caption: 'Pertemuan pertama' }, { url: '', caption: 'Hari lamaran' }], linkText: 'Baca kisah cinta kami', gallery: [] } },
    { id: 'events', type: 'events', enabled: true, data: { items: [
      { title: 'Welcome Aperitivo', venue: 'Taman Belakang Hotel Aurora', desc: 'Sambutan hangat dengan hidangan ringan dan musik akustik.', time: 'Jumat, 11 Juni 2027 • 18.00 WIB', mapUrl: 'https://maps.google.com' },
      { title: 'The Ceremony', venue: 'Ballroom Hotel Aurora', desc: 'Akad nikah dilanjutkan resepsi dan makan malam.', time: 'Sabtu, 12 Juni 2027 • 08.00 WIB', mapUrl: 'https://maps.google.com' }],
      moreDetails: { label: 'More Details', text: 'Mohon hadir 30 menit sebelum acara. Tersedia parkir untuk tamu.' } } },
    { id: 'dresscode', type: 'dresscode', enabled: true, data: { title: 'Dress Code', text: 'Kami dengan senang hati jika Anda mengenakan warna-warna berikut.', colors: ['#4A0E22', '#9C5B70', '#C98A9A', '#F3EDE4'] } },
    { id: 'countdown', type: 'countdown', enabled: true, data: { targetISO: '2027-06-12T08:00:00+07:00' } },
    { id: 'registry', type: 'registry', enabled: true, data: { title: 'Hadiah Pernikahan', text: 'Kehadiran Anda adalah hadiah terindah. Jika berkenan memberi tanda kasih:', buttons: [
      { label: 'The Wedding Registry', url: 'https://example.com', bank: '', accountNo: '', accountName: '' },
      { label: 'Honeymoon Fund', url: '', bank: 'BCA', accountNo: '1234567890', accountName: 'Alexander' }] } },
    { id: 'rsvp', type: 'rsvp', enabled: true, data: { title: 'Kindly RSVP', maxGuests: 8, questions: [
      { key: 'diet', label: 'Pantangan makanan', type: 'text', required: false },
      { key: 'song', label: 'Lagu untuk lantai dansa', type: 'text', required: false }], successMessage: 'Terima kasih, konfirmasi Anda sudah kami terima!' } },
    { id: 'wishes', type: 'wishes', enabled: true, data: {} },
    { id: 'footer', type: 'footer', enabled: true, data: { text: 'Terima kasih atas doa dan kehadiran Anda.' } }
  ]
};
