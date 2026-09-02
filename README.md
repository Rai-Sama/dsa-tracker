# DSA Auto-Tracker Extension

A lightweight browser extension (Chrome/Brave) designed to automatically detect successful Data Structures and Algorithms (DSA) submissions on LeetCode and NeetCode. It prompts you to log your thoughts, difficulty, and topics the moment you solve a problem, and organizes your history into a searchable, filterable revision dashboard.

## 🚀 Key Features

* **Automated Success Detection:** Intercepts hidden background network requests (`fetch` and `XHR`) to instantly trigger a logging modal upon an "Accepted" submission, preventing false positives from page text.
* **Smart Topic Memory Scraper:** Silently watches the DOM while you code, memorizing topic tags (even if they are later hidden by tab switches) to pre-fill your log entry.
* **Comprehensive Revision Dashboard:** A full-page local dashboard featuring multi-select topic filters, full-text search, and "Review Only" toggles to help you build a targeted revision schedule.
* **100% Local & Private:** All data is saved strictly to your browser's local extension storage (`chrome.storage.local`).
* **Portable Data:** Built-in JSON Export and Import capabilities ensure you never lose your history and can migrate across devices.

## 📂 Repository Structure

The extension is built using standard Manifest V3 web technologies without the need for a build step or external dependencies.

* **`manifest.json`**: The Manifest V3 configuration defining permissions (`storage`), host access, and content script injection rules.
* **`background.js`**: A lightweight service worker that listens for the extension icon click to open the Dashboard in a new tab.
* **`inject.js`**: The network interceptor. It temporarily overrides the browser's native `fetch` and `XMLHttpRequest` APIs to silently listen for successful grading responses from LeetCode/NeetCode backends.
* **`content.js`**: The primary content script. It runs the aggressive memory scraper for topics, listens for success signals from `inject.js`, and injects the logging modal into the webpage.
* **`content.css`**: Supplementary stylesheet for the injected modal overlay.
* **`dashboard.html`**: The structure and layout for the full-page revision logbook.
* **`dashboard.js`**: The logic for the dashboard, handling data retrieval, rendering, search filtering, multi-topic tagging, and JSON import/export functions securely.

## 🛠️ Installation Instructions

Because this is a custom, unpacked extension, you will install it directly via Developer Mode in your Chromium-based browser (Brave, Chrome, Edge).

1. Clone or download this repository to a dedicated folder on your machine (e.g., `~/projects/dsa_tracker`).
2. Open your browser and navigate to the extensions management page:
* **Brave:** `brave://extensions/`
* **Chrome:** `chrome://extensions/`


3. Toggle on **Developer mode** (usually located in the top right corner).
4. Click the **Load unpacked** button (usually in the top left).
5. Select the `dsa_tracker` folder.
6. The extension is now installed. *Tip: Pin the extension to your toolbar for easy access to your dashboard.*

## 💡 Usage Guide

**Logging a Problem:**

1. Navigate to any problem on LeetCode or NeetCode.
* *Note for NeetCode:* Expand the "Topics" accordion at least once before submitting so the memory scraper can detect and memorize the tags.


2. Code your solution and click **Submit**.
3. Upon a successful "Accepted" result, the modal will automatically overlay on your screen.
4. Add your notes, adjust the difficulty, toggle the "Important/Review" star, and click **Save Entry**.

**Reviewing Your Logs:**

1. Click the extension icon in your browser toolbar to open the DSA Logbook.
2. Use the search bar to find specific keywords in your notes or problem titles.
3. Select topics from the dropdown to add them as active filter pills (e.g., view only problems tagged with both *Arrays* AND *Two Pointers*).
4. Click the **Export JSON** button periodically to back up your progress to your local hard drive.

## ⚠️ Troubleshooting & Development

If you actively modify the code (such as adjusting `content.js` or `dashboard.js`), you must follow these steps to prevent the extension from throwing context invalidation errors:

1. Go back to your browser's extensions page (`brave://extensions/`).
2. Click the circular **Refresh** icon on the DSA Auto-Tracker card.
3. **Crucial:** Perform a hard refresh (`Ctrl + R` / `Cmd + R` or `F5`) on any currently open LeetCode or NeetCode tabs to clear the old scripts from memory and inject the updated code.
