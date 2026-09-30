<div align="center">
<img alt="Identixia" src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/brand/logo.png" width="320"/>

<a href="https://identixia.com"><img src="https://img.shields.io/badge/Website-0F766E?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Website" /></a>
<a href="https://docs.identixia.com"><img src="https://img.shields.io/badge/Docs-0F766E?style=for-the-badge&logo=gitbook&logoColor=white" alt="Docs" /></a>
<a href="https://huggingface.co/Identixia"><img src="https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Hugging Face" /></a>
<a href="https://hub.docker.com/u/identixia"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Hub" /></a>
<a href="https://playground.identixia.com/"><img src="https://img.shields.io/badge/Playground-0F766E?style=for-the-badge&logo=cloudplayground&logoColor=white" alt="Playground" /></a>
</div>

<div align="center">

# <img src="https://cdn.simpleicons.org/apachecordova/E8E8E8" width="32" height="32" alt="" /> Identixia ID Document Recognition and Liveness Detection — Ionic Cordova

</div>


**On-device ID document recognition** plugin for Android and iOS: passport MRZ OCR, ID card barcode, live capture, and optional document liveness / authenticity for KYC and eKYC. Processing stays on the device — **no** document images go to Identixia cloud.

Package: `document-reader-cordova`.

<p><img src="https://img.shields.io/badge/On-device-0F766E?style=flat-square" alt="On-device" /> <img src="https://img.shields.io/badge/Android%20%2B%20iOS-0F766E?style=flat-square" alt="Android%20%2B%20iOS" /> <img src="https://img.shields.io/badge/MRZ%20OCR-0F766E?style=flat-square" alt="MRZ%20OCR" /> <img src="https://img.shields.io/badge/Document%20liveness-0F766E?style=flat-square" alt="Document%20liveness" /> <img src="https://img.shields.io/badge/Plugin-5A6573?style=flat-square" alt="Plugin" /></p>


**Cordova**. Capacitor: [ID-Document-Recognition-Liveness-Detection-Ionic-Capacitor](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Capacitor).


---

## <img src="https://api.iconify.design/lucide/clipboard-list.svg?color=%230F766E" width="24" height="24" alt="" /> Basics

Read this once before cloning. Plugin demos ship a **bundled license** for the sample Android / iOS ids. Production apps need a new key. [Initial commands](#-initial-commands) lists clone → place runtime → run → activate options.

| Topic | Basic information |
| --- | --- |
| **Product** | On-device **ID document recognition** Ionic Cordova plugin (KYC / eKYC) |
| **Documents** | Passport, national ID, driver license |
| **Extracts** | OCR · passport MRZ · barcode / QR · optional document liveness |
| **Runtime** | Android AAR + iOS framework from Drive zips `PENDING` |
| **Demo id** | `com.identixia.documentreader` / `.app` (until **12 Aug 2027**) |
| **Tools** | npm · Cordova · physical arm64 Android / iPhone |
| **UI** | Wide Camera Home · Gallery / About · one-scroll Result |
| **Privacy** | All processing on device — no Identixia cloud for document data |


---

## <img src="https://api.iconify.design/lucide/terminal.svg?color=%230F766E" width="24" height="24" alt="" /> Initial commands

Must-know path for the sample / example app.

### <img src="https://img.shields.io/badge/-1-0F766E?style=for-the-badge" alt="" /> Clone, place runtime, run

```bash
git clone https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Cordova.git
cd ID-Document-Recognition-Liveness-Detection-Ionic-Cordova
# place Android + iOS runtimes first
npm install
npm run setup:android && npm run android
npm run setup:ios && npm run ios
```

### <img src="https://img.shields.io/badge/-2-0F766E?style=for-the-badge" alt="" /> Activate / license

Please [contact us](#-contact) to get a license for your own app. The sample already includes a demo license for its application id.


### <img src="https://img.shields.io/badge/-3-0F766E?style=for-the-badge" alt="" /> First capture

Wait until Home = **Ready**, then Camera / Gallery. Confirm Result / About shows a licensed state.


---

## <img src="https://api.iconify.design/lucide/list-checks.svg?color=%230F766E" width="24" height="24" alt="" /> What you get

| Capability | What it does |
| --- | --- |
| <img src="https://api.iconify.design/lucide/id-card.svg?color=%230F766E" width="16" height="16" alt="" /> Passport / ID / DL | On-device ID document recognition for passports, national IDs, and driver licenses |
| <img src="https://api.iconify.design/lucide/scan-text.svg?color=%230F766E" width="16" height="16" alt="" /> Passport MRZ OCR | Machine-readable zone OCR for ICAO travel documents |
| <img src="https://api.iconify.design/lucide/scan-barcode.svg?color=%230F766E" width="16" height="16" alt="" /> ID card barcode | PDF417 / barcode extraction on supported cards |
| <img src="https://api.iconify.design/lucide/camera.svg?color=%230F766E" width="16" height="16" alt="" /> Live capture | Camera locate + Capture; gallery front / optional back |
| <img src="https://api.iconify.design/lucide/shield.svg?color=%230F766E" width="16" height="16" alt="" /> Document liveness | Optional authenticity / PAD (screen, print, photo-swap) when licensed |
| <img src="https://api.iconify.design/lucide/scroll-text.svg?color=%230F766E" width="16" height="16" alt="" /> Result UI | One scroll: identity → fields → checks → images → Raw JSON |
| <img src="https://api.iconify.design/lucide/house.svg?color=%230F766E" width="16" height="16" alt="" /> Home UI | Wide Camera tile + Gallery / About |


---

## <img src="https://api.iconify.design/lucide/pc-case.svg?color=%230F766E" width="24" height="24" alt="" /> Requirements

| | |
| --- | --- |
| Devices | Physical **arm64** Android and/or **iPhone** |
| Demo Android id | `com.identixia.documentreader` |
| Demo iOS id | `com.identixia.documentreader.app` |
| Package | `document-reader-cordova` |

---

## <img src="https://api.iconify.design/lucide/package.svg?color=%230F766E" width="24" height="24" alt="" /> Install

The example builds with native runtimes already in the clone when present. Missing files are fetched from the `v1.0.0` GitHub Releases.

| | Path after unzip |
| --- | --- |
| <img src="https://cdn.simpleicons.org/android/3DDC84" width="14" height="14" alt="" /> Android | `DocumentReaderPlugin/src/android/documentreadersdk.aar` |
| <img src="https://cdn.simpleicons.org/apple/000000" width="14" height="14" alt="" /> iOS | `DocumentReaderPlugin/src/ios/Frameworks/docsdk.framework` |


Customer apps depend on `document-reader-cordova` from this repo at tag `v1.0.0` (Flutter: git; React Native / Ionic: npm / github). Do **not** use a monorepo `path:` dependency in shipping apps.

Prefer package kits (`DocumentCapture`, `ResultParser`) for the same camera / Result path as the sample. Keep `useLegacyPackaging = true` on Android when required by the engine.

---

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%230F766E" width="24" height="24" alt="" /> Run

```bash
git clone https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Cordova.git
cd ID-Document-Recognition-Liveness-Detection-Ionic-Cordova
# place Android + iOS runtimes first
npm install
npm run setup:android && npm run android
npm run setup:ios && npm run ios
```


---

## <img src="https://api.iconify.design/lucide/key-round.svg?color=%230F766E" width="24" height="24" alt="" /> License

Demo ids: Android `com.identixia.documentreader` · iOS `com.identixia.documentreader.app`. Demo license until **12 Aug 2027**.

The code below shows how to use the license:

[https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Cordova/blob/aec5b6d7ebb66e8ed00a78703057115dcb91533d/src/license.ts#L11-L20](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Cordova/blob/aec5b6d7ebb66e8ed00a78703057115dcb91533d/src/license.ts#L11-L20)

[https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Cordova/blob/aec5b6d7ebb66e8ed00a78703057115dcb91533d/src/SdkContext.tsx#L63-L73](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Cordova/blob/aec5b6d7ebb66e8ed00a78703057115dcb91533d/src/SdkContext.tsx#L63-L73)

Capabilities: document recognition and/or document liveness. Please [contact us](#-contact) to get a license for **your own app**.

---

## <img src="https://api.iconify.design/lucide/puzzle.svg?color=%230F766E" width="24" height="24" alt="" /> Use in your app

Add the Cordova plugin package `document-reader-cordova`, ensure the AAR and `docsdk.framework` are on the plugin native paths, then activate → init → recognize.

Depend on `document-reader-cordova` via **git** `ref: v1.0.0` (not a monorepo `path:`). Ship or download the AAR + framework, then activate → init → recognize.

---

## <img src="https://api.iconify.design/lucide/images.svg?color=%230F766E" width="24" height="24" alt="" /> Screenshots

<p align="center">
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/document-reader/desktop/demo-ui-status.png" width="720" alt="Document result status" />
</p>
<p align="center">
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/document-reader/desktop/demo-ui-fields-code.png" width="420" alt="CODE fields" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/document-reader/desktop/demo-ui-fields-visual.png" width="420" alt="VISUAL fields" />
</p>
<p align="center">
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/document-reader/desktop/demo-ui-images.png" width="420" alt="Cropped document images" />
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/document-reader/desktop/demo-ui-checks-validity.png" width="420" alt="Validity checks" />
</p>
<p align="center">
<img src="https://raw.githubusercontent.com/identixia-IDV/identixia-assets/main/screenshots/document-reader/desktop/demo-ui-checks-liveness.png" width="420" alt="Liveness checks" />
</p>

---

## <img src="https://api.iconify.design/lucide/layers.svg?color=%230F766E" width="24" height="24" alt="" /> Platforms

| | Platform | Repo |
| --- | --- | --- |
| <img src="https://cdn.simpleicons.org/android/3DDC84" width="18" height="18" alt="" /> | Android | [ID-Document-Recognition-Liveness-Detection-Android](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Android) |
| <img src="https://cdn.simpleicons.org/apple/000000" width="18" height="18" alt="" /> | iOS | [ID-Document-Recognition-Liveness-Detection-iOS](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-iOS) |
| <img src="https://cdn.simpleicons.org/flutter/02569B" width="18" height="18" alt="" /> | Flutter | [ID-Document-Recognition-Liveness-Detection-Flutter](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Flutter) |
| <img src="https://cdn.simpleicons.org/react/61DAFB" width="18" height="18" alt="" /> | React Native | [ID-Document-Recognition-Liveness-Detection-React-Native](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-React-Native) |
| <img src="https://cdn.simpleicons.org/ionic/3880FF" width="18" height="18" alt="" /> | Ionic Capacitor | [ID-Document-Recognition-Liveness-Detection-Ionic-Capacitor](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Capacitor) |
| <img src="https://cdn.simpleicons.org/apachecordova/E8E8E8" width="18" height="18" alt="" /> | Ionic Cordova | [ID-Document-Recognition-Liveness-Detection-Ionic-Cordova](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Ionic-Cordova) |
| <img src="https://cdn.simpleicons.org/windows/0078D4" width="18" height="18" alt="" /> | Windows | [ID-Document-Recognition-Liveness-Detection-Windows](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Windows) |
| <img src="https://cdn.simpleicons.org/docker/2496ED" width="18" height="18" alt="" /> | Linux / Docker | [ID-Document-Recognition-Liveness-Detection-Docker](https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Docker) |


---

## <img src="https://api.iconify.design/lucide/mail.svg?color=%230F766E" width="24" height="24" alt="" /> Contact

<div align="center">

<a href="mailto:contact@identixia.com"><img alt="Email contact@identixia.com" src="https://img.shields.io/badge/Email-contact%40identixia.com-0F766E?style=for-the-badge&logo=gmail&logoColor=white" /></a>
<a href="https://wa.me/17018854218"><img alt="WhatsApp +1 (701) 885-4218" src="https://img.shields.io/badge/WhatsApp-%2B1_(701)_885--4218-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
<a href="https://t.me/identixia"><img alt="Telegram @identixia" src="https://img.shields.io/badge/Telegram-%40identixia-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" /></a>

</div>
