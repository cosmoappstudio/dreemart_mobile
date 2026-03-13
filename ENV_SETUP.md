# Ortam Değişkenleri (Environment Variables)

## Yerel Geliştirme (.env)

Tüm key'ler `.env` dosyasında tanımlı. Proje kökünde `.env` oluşturun:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=...
EXPO_PUBLIC_AMPLITUDE_API_KEY=...
EXPO_PUBLIC_META_APP_ID=...
EXPO_PUBLIC_META_CLIENT_TOKEN=...
EAS_PROJECT_ID=...  # Push notifications için (opsiyonel)
```

## EAS Build (expo.dev)

Cloud build alırken `.env` yüklenmez. **EAS Secrets** kullanın:

```bash
# Expo dashboard: https://expo.dev → Projeniz → Secrets
# veya CLI ile:
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "..." --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..." --scope project
eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "..." --scope project
eas secret:create --name EXPO_PUBLIC_AMPLITUDE_API_KEY --value "..." --scope project
eas secret:create --name EXPO_PUBLIC_META_APP_ID --value "..." --scope project
eas secret:create --name EXPO_PUBLIC_META_CLIENT_TOKEN --value "..." --scope project
```

## Kullanıldıkları Yerler

| Değişken | Kullanım |
|----------|----------|
| `EXPO_PUBLIC_SUPABASE_*` | Supabase client, auth |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | In-app purchases (iOS) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | In-app purchases (Android) |
| `EXPO_PUBLIC_AMPLITUDE_API_KEY` | Analytics |
| `EXPO_PUBLIC_META_APP_ID` | Meta SDK (app.config.js plugin) |
| `EXPO_PUBLIC_META_CLIENT_TOKEN` | Meta SDK (app.config.js plugin) |
| `EAS_PROJECT_ID` | Push notification token (Expo Push) |
