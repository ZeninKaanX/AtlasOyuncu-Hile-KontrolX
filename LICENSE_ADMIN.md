# Atlas AC lisans yönetimi

Atlas AC tarama motoru, Ed25519 ile imzalanmış ve cihaza bağlanmış bir lisans olmadan çalışmaz. GitHub Pages yalnızca başvuru arayüzüdür; lisans kararı tarayıcı JavaScript'ine bırakılmaz.

## Kritik anahtar dosyası

Özel imzalama anahtarı yerel `secrets/atlas-license-private.pem` dosyasındadır. `secrets/` Git tarafından yok sayılır. Bu dosyayı:

- GitHub'a, Pages'a, Releases'a veya uygulama paketine yüklemeyin.
- Yalnızca yönetici cihazında, şifreli bir çevrimdışı yedekte saklayın.
- Kaybolursa mevcut anahtarla yeni lisans üretilemez; sızarsa yeni anahtar çifti oluşturulup uygulama yeniden dağıtılmalıdır.

Kullanıcının verdiği `SHA256:...` SSH parmak izi lisans imzalama anahtarı değildir. SSH parmak izi yalnızca bir SSH açık anahtarını tanımlar.

## Lisans üretme

Kullanıcı uygulamada **Taramayı Başlat** düğmesine bastığında gösterilen 64 karakterli Makine Kimliği'ni alın:

```bash
npm run license:issue -- --customer "Sunucu / Yetkili" --machine MAKINE_KIMLIGI --days 30 --out musteri-license.json
```

Üretilen `musteri-license.json` dosyasını yalnızca ilgili kullanıcıya gönderin. Kullanıcı dosyanın içeriğini uygulamanın lisans penceresine yapıştırır. Lisans; müşteri, cihaz, süre ve `scan` yetkisi değiştirilirse imza doğrulamasından geçmez.

Özel anahtar başka bir yerde tutuluyorsa:

```bash
ATLAS_LICENSE_PRIVATE_KEY_PATH=/guvenli/yol/private.pem npm run license:issue -- --customer "Ad" --machine MAKINE_KIMLIGI --days 30 --out license.json
```

## GitHub Pages

`.github/workflows/pages.yml`, `main` dalındaki `docs/` değişikliklerini GitHub Pages'a yayınlar. Depo ayarlarında **Settings → Pages → Source: GitHub Actions** bir kez seçilmelidir.

Beklenen proje adresi:

`https://zeninkaanx.github.io/AtlasOyuncu-Hile-KontrolX/`

## Gerçekçi güvenlik sınırı

İstemcinin sahibi ikili dosyayı ve çalıştığı bilgisayarı kontrol eder; bu nedenle hiçbir çevrimdışı istemci lisansı mutlak biçimde kırılamaz değildir. Ayrıca GPL ile herkese yayımlanmış kaynak kod, lisans denetimi kaldırılarak yeniden derlenebilir. Daha güçlü dağıtım kontrolü için depo ve sürüm dosyalarını özel tutun, yalnızca yetkili kişilere imzalı ikili verin ve sunucu taraflı kısa ömürlü yetkilendirme ekleyin. Daha önce GPL altında yayımlanmış kopyalara verilen haklar geriye dönük kaldırılamaz.
