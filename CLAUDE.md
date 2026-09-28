# DUOS tanıtım sitesi

GitHub Pages: https://yago0011.github.io/duos-site/ (main dalı, kök klasör; derleme adımı yok, düz HTML/CSS/JS).
Uygulamanın kendisi ayrı depoda: `yago0011/yago` (Expo / React Native). Uygulama hakkında ayrıntı gerekirse o deponun
`docs/PROJE_DURUMU.md` dosyasına bak.

## Kullanıcı ve çalışma şekli

- Kullanıcıyla **Türkçe** konuş, sade anlat, tıklanacak yerleri adım adım yaz. Windows / PowerShell kullanıyor.
- Sitenin dili **kurumsal ve düzgün Türkçe**: uzun çizgi (—) yok, fazla ünlem yok, "Harika!" gibi yapay zeka kokan reklam
  cümleleri yok. Kısa, net, güven veren cümleler.
- Kullanıcı ayrıntıya çok dikkat ediyor. Teslimden önce her sayfayı Playwright ile (Chromium: `/opt/pw-browsers/chromium`)
  masaüstü ve telefon genişliğinde ekran görüntüsü alıp **kendin gör**, hareketleri kısa videoyla kontrol et.
- Değişiklikleri main dalına commit + push et:
  `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit ...` (oturumun verdiği attribution satırlarıyla).
- Gizli bilgi (API anahtarı vb.) sohbete yazdırılmaz, depoya konmaz.

## Araçlar

- **UI/UX Pro Max skill'i** `.claude/skills/ui-ux-pro-max/` içinde. Tasarım kararlarından önce kullan
  (`python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<sorgu>" --domain <product|style|color|typography|ux|gsap>`).
- **Stitch** (Google): `.mcp.json` ile bağlı, anahtar ortamdaki `STITCH_API_KEY`. Ekran taslakları için.
- **Görseller:** kullanıcı Gemini Pro hesabıyla **Nano Banana 2**'de elle üretir ve sohbete yükler. Sen ona her görsel için
  hazır İngilizce komut (prompt), en-boy oranı ve nereye konacağını yaz. API anahtarı yok, sen doğrudan üretemezsin.
  Gelen görselleri WebP'ye çevir, boyutlandır (hero ≤ 250 KB, diğerleri ≤ 120 KB), `assets/` altına koy.

## DUOS nedir

Oyuncuların takım arkadaşı (duo) bulduğu mobil uygulama. Tinder mantığında kart kaydırma, ama flört değil oyun odaklı.
Hedef kitle Türkiye'deki oyuncular, Android öncelikli. Logo "İkili D" (iki parçalı D harfi); logoya dokunma.

Uygulamanın özellikleri (sitede anlatılacak olanlar):
- **Keşfet:** oyuncu kartları; favori oyun, rütbe, oyun tarzı (rekabetçi / eğlencesine), ülke, Discord / oyun içi sesli,
  ortak ilgi alanları, uyum yüzdesi. "Duo iste" ya da "Geç".
- **Eşleşme ve sohbet:** karşılıklı beğenide "Eşleştiniz" ekranı, hazır ilk mesaj önerileri, anlık sohbet, yazıyor göstergesi.
- **Hazırım modu:** şimdi oynamak isteyenleri öne çıkarır.
- **Güvenlik:** topluluk sözü, küfür ve kişisel bilgi filtresi, fotoğraf denetimi (yapay zeka), şikâyet ve engelleme,
  davranış puanı, yorumlar (birlikte oynadığın oyuncuyu değerlendirme). Yaş hiçbir yerde gösterilmez.
- **Seri:** her gün girişte artan günlük seri, Duolingo tarzı kutlama.
- **Görünüm ve mağaza:** hareketli avatar süsleri, profil çerçeveleri, banner efektleri (koleksiyonlar: Yasak Sayfalar,
  Mırıltılı Rüyalar, Taşların Fısıltısı, Bozkurt setleri vb.), animasyonlu ünvanlar (Yaşayan Efsane, Clutch Kralı...),
  bannerın kenarına oturan petler (Uykucu Tekir, Bozkurt Yavrusu).
- **Kasalar:** CS2 gibi kayan şeritle açılan kasalar; anahtar günlük görevlerle kazanılır; tekrar çıkan eşya Kasa Puanı'na döner.
- **Duos+:** üyelik; seni beğenenleri ve profiline bakanları görme, sınırsız kaydırma, özel temalar, süslerde indirim.
- **Discord:** DUOS Discord sunucusu, hesap bağlama, oyun rolleri, `/duo` komutu.
- Hesap silme, gizlilik ve kullanım şartları sayfaları sitede var (Google Play için gerekli; adresleri değiştirme).

Renkler (uygulamanın Aurora teması): koyu mor-lacivert zemin, mor #8B5CF6 → pembe #EC4899 geçişi, camgöbeği vurgu #5AF0FF.

Reklam için çekilmiş uygulama ekran videoları uygulama deposunda `art/reklam/` (betikler) altında; videolar depoda yok,
gerekirse betiklerle yeniden çekilir ya da kullanıcı yükler.

## Sayfalar

- `index.html`: ana tanıtım sayfası (hero, üç adımda eşleşme, özellikler, güvenlik, Duos+, SSS, kayıt çağrısı).
- `gizlilik.html`, `kullanim-sartlari.html`, `hesap-silme.html`: yasal sayfalar; içerik korunmalı, yalnızca görünüm yenilenebilir.

## Yapı (Eylül 2026 yenilemesi, "Aurora Noir")

- `assets/css/site.css`, `assets/js/site.js`: ana sayfa. Yasal sayfalar kökteki `style.css`'i kullanır.
- Yazı tipleri `assets/fonts/` (Archivo başlık, Geist metin, Geist Mono etiket), Türkçe alt kümeye indirildi (`pyftsubset`).
- Kütüphaneler `assets/vendor/` (GSAP 3.15 + ScrollTrigger + SplitText, Lenis). CDN yok, derleme yok.
- Hero giriş animasyonu saf CSS (Lighthouse LCP için); diğer animasyonlar sayfa yüklendikten sonra parça parça kurulur.
  Başlıklar (`data-split`) ekrana yaklaşınca bölünür. Ekran dışındaki bölümlerde (`data-zone`) CSS animasyonları durur.
- Görseller `assets/img/`: `oyuncu/` (Nano Banana portreleri, 256 px), `banner/` (kart bannerları 640 px, `bahce` 1200 px),
  `sus/` ve `pet/` (uygulama deposundaki süs ve pet çizimlerinden küçültüldü), `og.jpg` (paylaşım görseli, logo ve yazı kodla eklendi).
- Kasa oranları uygulamadaki `src/data/crates.ts` ile aynı; değişirse `site.js` içindeki `DROPS` da güncellenmeli.
- Ölçüm: yerelde gzip'li sunucuyla Lighthouse telefon 92-94, masaüstü 100 (erişilebilirlik, en iyi uygulamalar, SEO 100).
- Hareket azaltma: `.rm` sınıfı ve `prefers-reduced-motion` ile tüm animasyonlar kapanır, içerik doğrudan görünür.
