=== Pengoo WooCommerce Connector ===
Contributors: pengooteam
Tags: woocommerce, whatsapp, notifications, pengoo, automation
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 2.0.0
WC requires at least: 3.0
WC tested up to: 8.5
License: GPLv2 or later

Connect your WooCommerce store to Pengoo for automated WhatsApp notifications.

== Description ==

Pengoo WooCommerce Connector links your store to the Pengoo WhatsApp automation platform. With one click, your orders automatically trigger WhatsApp messages to customers — confirmations, tracking updates, OTP verification, and more.

**Features:**
* 1-Click OAuth-style connection (auto-generates WC API keys)
* Automatic webhook registration for order events
* International phone field with country code selector on checkout
* Premium admin dashboard with real-time connection status
* Zero configuration — everything managed from Pengoo cloud

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/pengoo-woocommerce-connector`
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Go to **Pengoo** in the sidebar and click **Connect Store to Pengoo**
4. Authorize on the Pengoo platform — done!

== Changelog ==

= 2.0.0 =
* [NEW] Real OAuth-style key exchange (auto-generates WC REST API keys)
* [NEW] Platform confirms connection back to WordPress — status shown in dashboard
* [NEW] International phone field with country code dropdown on WooCommerce checkout
* [NEW] Premium UI with glassmorphism, Google Fonts, inline SVG logo
* [NEW] Tab-based dashboard (Dashboard, Features, Settings)
* [FIX] Connection flow now performs actual handshake instead of just redirecting
* [FIX] All CSS/JS/assets are self-contained — no external dependencies

= 1.1.5 =
* Base64 embedded logo, ngrok integration, CSS visibility fix

= 1.1.4 =
* Premium redesign matching Pengoo.io platform aesthetics

= 1.1.3 =
* Self-contained architecture — all assets inlined

= 1.0.0 =
* Initial release
