<?php
/**
 * Plugin Name: Pengoo WooCommerce Connector
 * Plugin URI:  https://Pengoo.io
 * Description: Connect your WooCommerce store to Pengoo for automated WhatsApp messaging, order tracking, and OTP verification.
 * Version:     2.0.0
 * Author:      Pengoo Team
 * Author URI:  https://Pengoo.io
 * Text Domain: pengoo-woo
 * Requires at least: 5.0
 * Tested up to: 6.4
 * WC requires at least: 3.0
 * WC tested up to: 8.5
 */

if (!defined('ABSPATH')) exit;

define('PENGOO_WOO_VERSION', '2.0.0');
define('PENGOO_WOO_BASENAME', plugin_basename(__FILE__));
define('PENGOO_APP_URL', 'https://unimaged-thea-enactory.ngrok-free.dev');

// ══════════════════════════════════════════════════════════════
// 1. API — Key Exchange Endpoint for OAuth-like Connection
// ══════════════════════════════════════════════════════════════
class Pengoo_API {
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // Key Exchange — called by the Pengoo platform
        register_rest_route('pengoo/v1', '/exchange-keys', [
            'methods'  => 'POST',
            'callback' => [$this, 'exchange_keys'],
            'permission_callback' => '__return_true', // Public, secured by temp_token
        ]);

        // Connection callback — platform confirms connection
        register_rest_route('pengoo/v1', '/connect', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_connect'],
            'permission_callback' => '__return_true',
        ]);

        // Status check
        register_rest_route('pengoo/v1', '/status', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_status'],
            'permission_callback' => function() { return current_user_can('manage_woocommerce'); },
        ]);
    }

    public function exchange_keys($request) {
        $params = $request->get_json_params();
        $temp_token = isset($params['temp_token']) ? sanitize_text_field($params['temp_token']) : '';

        if (empty($temp_token)) {
            return new WP_Error('missing_token', 'temp_token is required.', ['status' => 400]);
        }

        $stored = get_transient('pengoo_temp_token');
        if (!$stored || $stored['token'] !== $temp_token) {
            return new WP_Error('invalid_token', 'Invalid or expired token.', ['status' => 403]);
        }

        // Return the keys
        $response = new WP_REST_Response([
            'consumer_key'    => $stored['consumer_key'],
            'consumer_secret' => $stored['consumer_secret'],
            'store_url'       => get_site_url(),
        ], 200);

        // Delete the transient immediately — single use
        delete_transient('pengoo_temp_token');

        return $response;
    }

    public function handle_connect($request) {
        $params = $request->get_json_params();
        if (!empty($params['api_key'])) {
            update_option('pengoo_api_key', sanitize_text_field($params['api_key']));
        }
        update_option('pengoo_connected', true);
        update_option('pengoo_connected_at', current_time('mysql'));
        return new WP_REST_Response(['success' => true, 'message' => 'Connected!'], 200);
    }

    public function get_status($request) {
        return new WP_REST_Response([
            'connected'    => (bool) get_option('pengoo_connected', false),
            'connected_at' => get_option('pengoo_connected_at', ''),
            'version'      => PENGOO_WOO_VERSION,
        ], 200);
    }
}

// ══════════════════════════════════════════════════════════════
// 2. WooCommerce Hooks — Order Events
// ══════════════════════════════════════════════════════════════
class Pengoo_Hooks {
    public function __construct() {
        add_action('woocommerce_new_order', [$this, 'on_new_order'], 10, 1);
        add_action('woocommerce_order_status_changed', [$this, 'on_status_change'], 10, 4);
    }

    public function on_new_order($order_id) {
        if (!get_option('pengoo_connected')) return;
        $order = wc_get_order($order_id);
        if (!$order) return;
        $this->notify('order_created', [
            'order_id'       => $order_id,
            'customer_phone' => $order->get_billing_phone(),
            'customer_name'  => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            'order_total'    => $order->get_total(),
            'currency'       => $order->get_currency(),
        ]);
    }

    public function on_status_change($order_id, $old, $new, $order) {
        if (!get_option('pengoo_connected') || !is_object($order)) return;
        $this->notify('order_status_updated', [
            'order_id'       => $order_id,
            'old_status'     => $old,
            'new_status'     => $new,
            'customer_phone' => $order->get_billing_phone(),
            'customer_name'  => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
        ]);
    }

    private function notify($event, $data) {
        $key = get_option('pengoo_api_key');
        if (!$key) return;
        wp_remote_post(PENGOO_APP_URL . '/api/webhooks/woocommerce', [
            'body'    => json_encode(['event' => $event, 'data' => $data, 'store_url' => get_site_url()]),
            'headers' => ['Content-Type' => 'application/json', 'X-Pengoo-Key' => $key],
            'timeout' => 15,
        ]);
    }
}

// ══════════════════════════════════════════════════════════════
// 3. Checkout — Premium Inline Phone Field with Flags
// ══════════════════════════════════════════════════════════════
class Pengoo_Checkout {
    public function __construct() {
        if (!get_option('pengoo_phone_enabled', true)) return;
        add_filter('woocommerce_checkout_fields', [$this, 'customize_phone_field']);
        add_action('woocommerce_after_checkout_form', [$this, 'inject_phone_assets']);
        add_action('woocommerce_checkout_process', [$this, 'validate_phone']);
        add_filter('woocommerce_checkout_posted_data', [$this, 'format_phone_data']);
    }

    public function customize_phone_field($fields) {
        if (isset($fields['billing']['billing_phone'])) {
            $fields['billing']['billing_phone']['class'] = ['form-row-wide pengoo-intl-phone-row'];
            $fields['billing']['billing_phone']['input_class'] = ['pengoo-phone-input'];
            $fields['billing']['billing_phone']['custom_attributes'] = [
                'data-pengoo-phone' => '1',
                'autocomplete' => 'tel-national',
            ];
        }
        return $fields;
    }

    public function validate_phone() {
        $phone = isset($_POST['billing_phone']) ? sanitize_text_field($_POST['billing_phone']) : '';
        $digits = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($digits) < 10) {
            wc_add_notice(__('Please enter a valid phone number with country code.', 'pengoo-woo'), 'error');
        }
    }

    public function format_phone_data($data) {
        if (!empty($data['billing_phone'])) {
            $phone = preg_replace('/[^0-9+]/', '', $data['billing_phone']);
            if (substr($phone, 0, 1) !== '+') {
                $phone = '+' . $phone;
            }
            $data['billing_phone'] = $phone;
        }
        return $data;
    }

    public function inject_phone_assets() {
        $init_country = strtolower(get_option('pengoo_default_country', 'sa'));
        ?>
        <style>
        .pengoo-intl-phone-row .woocommerce-input-wrapper {
            position: relative !important; display: flex !important;
        }
        .pengoo-phone-input {
            padding-left: 120px !important; font-size: 16px !important;
            letter-spacing: 0.5px; direction: ltr !important; text-align: left !important;
        }
        html[dir="rtl"] .pengoo-phone-input, body.rtl .pengoo-phone-input {
            padding-left: 14px !important; padding-right: 120px !important;
            text-align: left !important; direction: ltr !important;
        }
        .pengoo-country-btn {
            position: absolute; left: 1px; top: 1px; bottom: 1px; z-index: 10;
            display: flex; align-items: center; gap: 6px; padding: 0 10px;
            background: #f8fafc; border: none; border-right: 1px solid #e2e8f0;
            border-radius: 4px 0 0 4px; cursor: pointer; font-size: 14px;
            font-family: inherit; color: #334155; transition: background 0.15s;
            white-space: nowrap;
        }
        .pengoo-country-btn:hover { background: #e2e8f0; }
        .pengoo-country-btn .pg-fi { width: 24px; height: 18px; border-radius: 3px; object-fit: cover; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
        .pengoo-country-btn .pengoo-code { font-weight: 700; font-size: 14px; direction: ltr; }
        .pengoo-country-btn .pengoo-arrow { font-size: 9px; color: #94a3b8; transition: transform 0.2s; margin-left: 2px; }
        .pengoo-country-btn.open .pengoo-arrow { transform: rotate(180deg); }
        html[dir="rtl"] .pengoo-country-btn, body.rtl .pengoo-country-btn {
            left: auto; right: 1px; border-right: none; border-left: 1px solid #e2e8f0;
            border-radius: 0 4px 4px 0;
        }
        .pengoo-dropdown {
            position: absolute; top: calc(100% + 4px); left: 0; z-index: 9999;
            width: 320px; max-height: 340px; background: #fff; border: 1px solid #e2e8f0;
            border-radius: 14px; box-shadow: 0 20px 60px -12px rgba(0,0,0,0.15);
            overflow: hidden; display: none; animation: pengooSlide 0.2s ease-out;
        }
        .pengoo-dropdown.open { display: block; }
        @keyframes pengooSlide { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        html[dir="rtl"] .pengoo-dropdown, body.rtl .pengoo-dropdown { left: auto; right: 0; }
        .pengoo-search-wrap { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; background: #fff; position: sticky; top: 0; z-index: 1; }
        .pengoo-search {
            width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;
            font-size: 14px; outline: none; background: #f8fafc; box-sizing: border-box;
            font-family: inherit; transition: border-color 0.15s;
        }
        .pengoo-search:focus { border-color: #2e69ff; background: #fff; }
        .pengoo-search::placeholder { color: #94a3b8; }
        .pengoo-list { max-height: 260px; overflow-y: auto; padding: 4px; }
        .pengoo-list::-webkit-scrollbar { width: 6px; }
        .pengoo-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .pengoo-country-item {
            display: flex; align-items: center; gap: 10px; padding: 10px 12px;
            cursor: pointer; border-radius: 10px; transition: background 0.1s; font-size: 14px;
        }
        .pengoo-country-item:hover { background: #f1f5f9; }
        .pengoo-country-item.selected { background: #eff6ff; }
        .pengoo-country-item .pg-fi { width: 28px; height: 20px; border-radius: 3px; object-fit: cover; flex-shrink: 0; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
        .pengoo-country-item .pengoo-name { flex: 1; color: #334155; font-weight: 500; }
        .pengoo-country-item .pengoo-dial { color: #64748b; font-weight: 700; font-size: 13px; direction: ltr; }
        </style>
        <script>
        (function(){
            var CC = [
                {c:'sa',d:'+966',n:'Saudi Arabia',a:'السعودية'},
                {c:'ae',d:'+971',n:'UAE',a:'الإمارات'},
                {c:'eg',d:'+20',n:'Egypt',a:'مصر'},
                {c:'kw',d:'+965',n:'Kuwait',a:'الكويت'},
                {c:'bh',d:'+973',n:'Bahrain',a:'البحرين'},
                {c:'qa',d:'+974',n:'Qatar',a:'قطر'},
                {c:'om',d:'+968',n:'Oman',a:'عُمان'},
                {c:'jo',d:'+962',n:'Jordan',a:'الأردن'},
                {c:'lb',d:'+961',n:'Lebanon',a:'لبنان'},
                {c:'iq',d:'+964',n:'Iraq',a:'العراق'},
                {c:'ps',d:'+970',n:'Palestine',a:'فلسطين'},
                {c:'ye',d:'+967',n:'Yemen',a:'اليمن'},
                {c:'sy',d:'+963',n:'Syria',a:'سوريا'},
                {c:'sd',d:'+249',n:'Sudan',a:'السودان'},
                {c:'ly',d:'+218',n:'Libya',a:'ليبيا'},
                {c:'ma',d:'+212',n:'Morocco',a:'المغرب'},
                {c:'tn',d:'+216',n:'Tunisia',a:'تونس'},
                {c:'dz',d:'+213',n:'Algeria',a:'الجزائر'},
                {c:'tr',d:'+90',n:'Turkey',a:'تركيا'},
                {c:'pk',d:'+92',n:'Pakistan',a:'باكستان'},
                {c:'in',d:'+91',n:'India',a:'الهند'},
                {c:'us',d:'+1',n:'United States',a:'أمريكا'},
                {c:'gb',d:'+44',n:'United Kingdom',a:'بريطانيا'},
                {c:'de',d:'+49',n:'Germany',a:'ألمانيا'},
                {c:'fr',d:'+33',n:'France',a:'فرنسا'},
                {c:'it',d:'+39',n:'Italy',a:'إيطاليا'},
                {c:'es',d:'+34',n:'Spain',a:'إسبانيا'},
                {c:'nl',d:'+31',n:'Netherlands',a:'هولندا'},
                {c:'ca',d:'+1',n:'Canada',a:'كندا'},
                {c:'au',d:'+61',n:'Australia',a:'أستراليا'},
                {c:'my',d:'+60',n:'Malaysia',a:'ماليزيا'},
                {c:'id',d:'+62',n:'Indonesia',a:'إندونيسيا'},
                {c:'ng',d:'+234',n:'Nigeria',a:'نيجيريا'},
                {c:'za',d:'+27',n:'South Africa',a:'جنوب أفريقيا'},
                {c:'br',d:'+55',n:'Brazil',a:'البرازيل'}
            ];
            var isAr = document.documentElement.lang && document.documentElement.lang.startsWith('ar');
            var initCode = '<?php echo esc_js($init_country); ?>';
            function flagUrl(code) { return 'https://flagcdn.com/w40/' + code.toLowerCase() + '.png'; }
            function init() {
                var input = document.querySelector('input[data-pengoo-phone]');
                if (!input) return;
                var wrap = input.closest('.woocommerce-input-wrapper') || input.parentElement;
                wrap.style.position = 'relative';
                var sel = CC.find(function(x){return x.c===initCode;}) || CC[0];
                // Button
                var btn = document.createElement('div');
                btn.className = 'pengoo-country-btn';
                btn.innerHTML = '<img class="pg-fi" src="'+flagUrl(sel.c)+'" alt="'+sel.c+'">'
                    + '<span class="pengoo-code">'+sel.d+'</span>'
                    + '<span class="pengoo-arrow">▼</span>';
                wrap.insertBefore(btn, input);
                // Dropdown
                var dd = document.createElement('div');
                dd.className = 'pengoo-dropdown';
                var sw = document.createElement('div');
                sw.className = 'pengoo-search-wrap';
                var si = document.createElement('input');
                si.className = 'pengoo-search'; si.type = 'text';
                si.placeholder = isAr ? '🔍 ابحث عن الدولة...' : '🔍 Search country...';
                sw.appendChild(si); dd.appendChild(sw);
                var list = document.createElement('div');
                list.className = 'pengoo-list'; dd.appendChild(list);
                wrap.appendChild(dd);
                function render(q) {
                    q = (q||'').toLowerCase(); list.innerHTML = '';
                    CC.forEach(function(c){
                        if(q && c.n.toLowerCase().indexOf(q)===-1 && c.a.indexOf(q)===-1 && c.d.indexOf(q)===-1 && c.c.indexOf(q)===-1) return;
                        var it = document.createElement('div');
                        it.className = 'pengoo-country-item' + (c.c===sel.c?' selected':'');
                        it.innerHTML = '<img class="pg-fi" src="'+flagUrl(c.c)+'" alt="'+c.c+'">'
                            + '<span class="pengoo-name">'+(isAr?c.a:c.n)+'</span>'
                            + '<span class="pengoo-dial">'+c.d+'</span>';
                        it.addEventListener('click', function(){
                            sel = c;
                            btn.querySelector('.pg-fi').src = flagUrl(c.c);
                            btn.querySelector('.pengoo-code').textContent = c.d;
                            dd.classList.remove('open'); btn.classList.remove('open');
                            si.value = '';
                            var raw = input.value.replace(/^[\+\d\s\-]+?(?=\d{5,})/,'').replace(/^0+/,'');
                            input.value = raw; input.focus(); render('');
                        });
                        list.appendChild(it);
                    });
                }
                render('');
                btn.addEventListener('click', function(e){
                    e.stopPropagation();
                    var o = dd.classList.toggle('open'); btn.classList.toggle('open',o);
                    if(o){si.value='';render('');setTimeout(function(){si.focus();},100);}
                });
                si.addEventListener('input', function(){render(this.value);});
                si.addEventListener('click', function(e){e.stopPropagation();});
                document.addEventListener('click', function(){dd.classList.remove('open');btn.classList.remove('open');});
                var form = input.closest('form');
                if(form) form.addEventListener('submit', function(){
                    var raw = input.value.replace(/^0+/,'');
                    if(raw && raw.charAt(0)!=='+') input.value = sel.d + raw;
                });
            }
            if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
        })();
        </script>
        <?php
    }
}


// ══════════════════════════════════════════════════════════════
// 4. Admin Dashboard — Premium UI
// ══════════════════════════════════════════════════════════════
class Pengoo_Admin {
    public function __construct() {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_head', [$this, 'inject_css']);
        add_action('admin_footer', [$this, 'inject_js']);
        add_action('wp_ajax_pengoo_disconnect', [$this, 'ajax_disconnect']);
        add_action('wp_ajax_pengoo_initiate_connect', [$this, 'ajax_initiate_connect']);
        add_action('wp_ajax_pengoo_save_settings', [$this, 'ajax_save_settings']);
    }

    public function add_menu() {
        add_menu_page('Pengoo', 'Pengoo', 'manage_woocommerce', 'pengoo-connector', [$this, 'render_page'], 'dashicons-whatsapp', 56);
    }

    // ── AJAX: Initiate Connection ──
    public function ajax_initiate_connect() {
        check_ajax_referer('pengoo_admin_nonce', 'nonce');
        if (!current_user_can('manage_woocommerce')) wp_send_json_error('Unauthorized');

        // Generate WC REST API keys
        global $wpdb;
        $user_id = get_current_user_id();
        $description = 'Pengoo Connector — Auto Generated';

        // Check if keys already exist
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT consumer_key, consumer_secret, truncated_key FROM {$wpdb->prefix}woocommerce_api_keys WHERE user_id = %d AND description = %s",
            $user_id, $description
        ));

        if ($existing) {
            // Keys exist but we can't read the hashed consumer_secret, so regenerate
            $wpdb->delete($wpdb->prefix . 'woocommerce_api_keys', ['user_id' => $user_id, 'description' => $description]);
        }

        // Generate new keys
        $consumer_key    = 'ck_' . wc_rand_hash();
        $consumer_secret = 'cs_' . wc_rand_hash();

        $wpdb->insert($wpdb->prefix . 'woocommerce_api_keys', [
            'user_id'         => $user_id,
            'description'     => $description,
            'permissions'     => 'read_write',
            'consumer_key'    => wc_api_hash($consumer_key),
            'consumer_secret' => $consumer_secret,
            'truncated_key'   => substr($consumer_key, -7),
        ]);

        // Store in transient for exchange — 5 min TTL
        $temp_token = wp_generate_password(32, false);
        set_transient('pengoo_temp_token', [
            'token'           => $temp_token,
            'consumer_key'    => $consumer_key,
            'consumer_secret' => $consumer_secret,
        ], 300);

        $redirect_url = PENGOO_APP_URL . '/woocommerce-auth?' . http_build_query([
            'store_url'  => get_site_url(),
            'temp_token' => $temp_token,
            'return_url' => admin_url('admin.php?page=pengoo-connector&connected=1'),
        ]);

        wp_send_json_success(['redirect_url' => $redirect_url]);
    }

    // ── AJAX: Save Settings ──
    public function ajax_save_settings() {
        check_ajax_referer('pengoo_admin_nonce', 'nonce');
        if (!current_user_can('manage_woocommerce')) wp_send_json_error('Unauthorized');
        update_option('pengoo_phone_enabled', isset($_POST['phone_enabled']) && $_POST['phone_enabled'] === '1');
        update_option('pengoo_default_country', sanitize_text_field($_POST['default_country'] ?? 'sa'));
        wp_send_json_success(['message' => 'Settings saved!']);
    }

    // ── AJAX: Disconnect ──
    public function ajax_disconnect() {
        check_ajax_referer('pengoo_admin_nonce', 'nonce');
        if (!current_user_can('manage_woocommerce')) wp_send_json_error('Unauthorized');
        delete_option('pengoo_connected');
        delete_option('pengoo_api_key');
        delete_option('pengoo_connected_at');
        wp_send_json_success();
    }

    // ── CSS ──
    public function inject_css() {
        $screen = get_current_screen();
        if (!$screen || $screen->id !== 'toplevel_page_pengoo-connector') return;
        ?>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&family=Noto+Sans+Arabic:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            /* ── Variables ── */
            :root {
                --pg-primary: #2e69ff;
                --pg-primary-dk: #1d4ed8;
                --pg-bg: #f5f6f8;
                --pg-surface: #ffffff;
                --pg-text: #0f172a;
                --pg-text-lt: #64748b;
                --pg-border: rgba(226,232,240,0.8);
                --pg-glass: rgba(255,255,255,0.75);
                --pg-radius: 20px;
            }

            /* ── Scope ── */
            .pg-wrap {
                font-family: 'Manrope', 'Noto Sans Arabic', -apple-system, sans-serif;
                color: var(--pg-text);
                max-width: 960px;
                margin: 30px auto;
                padding: 0 20px;
                -webkit-font-smoothing: antialiased;
            }
            .pg-wrap * { box-sizing: border-box; }

            /* ── Header ── */
            .pg-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px 28px;
                background: var(--pg-glass);
                backdrop-filter: blur(20px);
                border-radius: var(--pg-radius);
                border: 1px solid var(--pg-border);
                margin-bottom: 28px;
                box-shadow: 0 4px 24px -6px rgba(0,0,0,0.06);
            }
            .pg-logo { display: flex; align-items: center; gap: 14px; }
            .pg-logo svg { height: 40px; width: auto; }
            .pg-tabs { display: flex; gap: 4px; background: #f1f5f9; padding: 5px; border-radius: 14px; }
            .pg-tab {
                padding: 9px 22px; text-decoration: none; color: var(--pg-text-lt);
                font-weight: 600; border-radius: 10px; font-size: 13px;
                transition: all 0.2s ease; cursor: pointer; border: none; background: none;
            }
            .pg-tab:hover { color: var(--pg-text); }
            .pg-tab.active { background: white; color: var(--pg-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

            /* ── Cards ── */
            .pg-card {
                background: white; border-radius: var(--pg-radius); padding: 36px;
                border: 1px solid var(--pg-border); box-shadow: 0 8px 24px -8px rgba(0,0,0,0.04);
                margin-bottom: 24px; position: relative; overflow: hidden;
            }
            .pg-card h2 { font-size: 22px; font-weight: 800; margin: 0 0 10px; }
            .pg-card p { font-size: 15px; color: var(--pg-text-lt); line-height: 1.7; margin: 0 0 20px; }

            /* ── Hero (Not Connected) ── */
            .pg-hero {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2148 100%);
                color: #fff; border: none; padding: 48px 40px;
            }
            .pg-hero::before {
                content: ''; position: absolute; top: -50%; right: -30%;
                width: 400px; height: 400px; border-radius: 50%;
                background: radial-gradient(circle, rgba(46,105,255,0.15) 0%, transparent 70%);
            }
            .pg-hero h1 { font-size: 32px; font-weight: 800; margin: 0 0 14px; color: #fff; position: relative; z-index: 1; }
            .pg-hero p { color: rgba(255,255,255,0.65); font-size: 16px; margin: 0 0 28px; position: relative; z-index: 1; }

            /* ── Connected Banner ── */
            .pg-connected {
                background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
                border: 1px solid #bbf7d0; padding: 32px 36px;
            }
            .pg-connected-inner { display: flex; align-items: flex-start; gap: 16px; }
            .pg-connected-icon {
                width: 52px; height: 52px; background: #22c55e; border-radius: 14px;
                display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                box-shadow: 0 8px 16px -4px rgba(34,197,94,0.3);
            }
            .pg-connected-icon svg { width: 28px; height: 28px; color: white; }
            .pg-connected h3 { font-size: 20px; font-weight: 800; color: #166534; margin: 0 0 4px; }
            .pg-connected .pg-url { font-size: 14px; color: #15803d; font-weight: 600; direction: ltr; }
            .pg-connected .pg-time { font-size: 12px; color: #4ade80; margin-top: 6px; }

            /* ── Buttons ── */
            .pg-btn {
                display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                padding: 14px 30px; border-radius: 14px; font-weight: 800; cursor: pointer;
                border: none; font-size: 15px; font-family: inherit;
                transition: all 0.2s cubic-bezier(0.4,0,0.2,1); position: relative; z-index: 1;
            }
            .pg-btn-primary {
                background: var(--pg-primary); color: #fff;
                box-shadow: 0 8px 20px -6px rgba(46,105,255,0.5);
            }
            .pg-btn-primary:hover { background: var(--pg-primary-dk); transform: translateY(-2px); box-shadow: 0 12px 28px -8px rgba(46,105,255,0.6); }
            .pg-btn-danger {
                background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
                padding: 10px 20px; font-size: 13px; font-weight: 700;
            }
            .pg-btn-danger:hover { background: #fee2e2; }
            .pg-btn-ghost {
                background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8);
                border: 1px solid rgba(255,255,255,0.15); padding: 10px 20px; font-size: 13px;
            }

            /* ── Tabs Content ── */
            .pg-tab-content { display: none; }
            .pg-tab-content.active { display: block; animation: pgFadeUp 0.4s ease-out; }
            @keyframes pgFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

            /* ── Features Grid ── */
            .pg-features { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
            .pg-feature {
                background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;
                transition: all 0.2s ease;
            }
            .pg-feature:hover { border-color: var(--pg-primary); transform: translateY(-2px); box-shadow: 0 8px 20px -8px rgba(46,105,255,0.1); }
            .pg-feature-icon {
                width: 44px; height: 44px; border-radius: 12px; display: flex;
                align-items: center; justify-content: center; margin-bottom: 14px; font-size: 22px;
            }
            .pg-feature h4 { font-size: 15px; font-weight: 800; margin: 0 0 6px; color: var(--pg-text); }
            .pg-feature p { font-size: 13px; color: var(--pg-text-lt); margin: 0; line-height: 1.6; }

            /* ── Footer ── */
            .pg-footer { text-align: center; color: var(--pg-text-lt); margin-top: 36px; padding-bottom: 40px; font-size: 13px; }

            /* ── Notices Override ── */
            .notice, .updated, .error, .update-nag, .is-dismissible, 
            .woocommerce-message, .woocommerce-error, .woocommerce-info { 
                display: none !important; 
            }

            /* ── Spinner ── */
            .pg-spinner { display: inline-block; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #fff; border-radius: 50%; animation: pgSpin 0.6s linear infinite; }
            @keyframes pgSpin { to { transform: rotate(360deg); } }
        </style>
        <?php
    }

    // ── JS ──
    public function inject_js() {
        $screen = get_current_screen();
        if (!$screen || $screen->id !== 'toplevel_page_pengoo-connector') return;
        $nonce = wp_create_nonce('pengoo_admin_nonce');
        ?>
        <script>
        jQuery(function($) {
            // Tab switching
            $('.pg-tab').on('click', function(e) {
                e.preventDefault();
                var t = $(this).data('tab');
                $('.pg-tab').removeClass('active');
                $(this).addClass('active');
                $('.pg-tab-content').removeClass('active').hide();
                $('#pg-' + t).addClass('active').fadeIn(250);
            });


            // Connect button
            $('#pg-connect-btn').on('click', function(e) {
                e.preventDefault();
                var $btn = $(this);
                $btn.prop('disabled', true).html('<span class="pg-spinner"></span> Connecting...');
                $.post(ajaxurl, { action: 'pengoo_initiate_connect', nonce: '<?php echo $nonce; ?>' }, function(res) {
                    if (res.success && res.data.redirect_url) {
                        window.open(res.data.redirect_url, '_blank');
                        $btn.html('✓ Redirected — Complete in new tab').css('opacity', 0.7);
                        // Poll for connection status
                        var poll = setInterval(function() {
                            $.get('<?php echo rest_url('pengoo/v1/status'); ?>', function(s) {
                                if (s.connected) {
                                    clearInterval(poll);
                                    location.reload();
                                }
                            });
                        }, 3000);
                    } else {
                        $btn.prop('disabled', false).html('Connect Store to Pengoo');
                        alert('Error: ' + (res.data || 'Unknown error'));
                    }
                });
            });

            // Disconnect button
            $('#pg-disconnect-btn').on('click', function(e) {
                e.preventDefault();
                if (!confirm('Are you sure you want to disconnect your store from Pengoo?')) return;
                $.post(ajaxurl, { action: 'pengoo_disconnect', nonce: '<?php echo $nonce; ?>' }, function() {
                    location.reload();
                });
            });

            // Save settings
            $('#pg-settings-form').on('submit', function(e) {
                e.preventDefault();
                var $btn = $(this).find('button[type=submit]');
                $btn.prop('disabled', true).text('Saving...');
                var data = $(this).serializeArray();
                data.push({name:'action',value:'pengoo_save_settings'});
                data.push({name:'nonce',value:'<?php echo $nonce; ?>'});
                $.post(ajaxurl, $.param(data), function(res) {
                    $btn.prop('disabled', false).text('✓ Saved!');
                    setTimeout(function(){ $btn.text('Save Settings'); }, 2000);
                });
            });

            // Auto-detect return from auth
            var urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('connected') === '1') {
                $.post(ajaxurl, { action: 'pengoo_initiate_connect', nonce: '<?php echo $nonce; ?>' });
            }
        });
        </script>
        <?php
    }

    // ── Render ──
    public function render_page() {
        $is_connected = (bool) get_option('pengoo_connected', false);
        $connected_at = get_option('pengoo_connected_at', '');
        $store_url    = get_site_url();
        ?>
        <div class="wrap pg-wrap">
            <!-- Header -->
            <header class="pg-header">
                <div class="pg-logo">
                    <svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="pg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#2e69ff"/>
                                <stop offset="100%" style="stop-color:#1d4ed8"/>
                            </linearGradient>
                        </defs>
                        <text x="15" y="150" font-family="'Noto Sans Arabic', 'Manrope', sans-serif" font-size="130" font-weight="800" fill="url(#pg-grad)">بينجو</text>
                        <circle cx="540" cy="80" r="45" fill="none" stroke="#2e69ff" stroke-width="8"/>
                        <path d="M520,80 L540,60 L560,80" fill="none" stroke="#2e69ff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M560,100 Q580,110 570,130" fill="none" stroke="#2e69ff" stroke-width="7" stroke-linecap="round"/>
                    </svg>
                </div>
                <nav class="pg-tabs">
                    <button class="pg-tab active" data-tab="dashboard">Dashboard</button>
                    <button class="pg-tab" data-tab="features">All Features</button>
                </nav>
            </header>

            <!-- Dashboard Tab -->
            <div id="pg-dashboard" class="pg-tab-content active">

                <?php if ($is_connected): ?>
                    <!-- Connected State -->
                    <div class="pg-card pg-connected">
                        <div class="pg-connected-inner">
                            <div class="pg-connected-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                            </div>
                            <div>
                                <h3>Store Connected Successfully! 🎉</h3>
                                <div class="pg-url"><?php echo esc_html($store_url); ?></div>
                                <?php if ($connected_at): ?>
                                    <div class="pg-time">Connected: <?php echo esc_html($connected_at); ?></div>
                                <?php endif; ?>
                            </div>
                        </div>
                        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                            <a href="<?php echo esc_url(PENGOO_APP_URL . '/dashboard/integrations/woocommerce'); ?>" class="pg-btn pg-btn-primary" target="_blank" style="text-decoration:none;">
                                Open Pengoo Dashboard
                            </a>
                            <button id="pg-disconnect-btn" class="pg-btn pg-btn-danger">Disconnect</button>
                        </div>
                    </div>

                    <?php
                    $phone_on = get_option('pengoo_phone_enabled', true);
                    $def_cc   = get_option('pengoo_default_country', 'sa');
                    $cc_opts  = ['sa'=>'Saudi Arabia','ae'=>'UAE','eg'=>'Egypt','kw'=>'Kuwait','bh'=>'Bahrain','qa'=>'Qatar','om'=>'Oman','jo'=>'Jordan','lb'=>'Lebanon','iq'=>'Iraq','ps'=>'Palestine','ye'=>'Yemen','sy'=>'Syria','sd'=>'Sudan','ly'=>'Libya','ma'=>'Morocco','tn'=>'Tunisia','dz'=>'Algeria','tr'=>'Turkey','pk'=>'Pakistan','in'=>'India','us'=>'USA','gb'=>'UK','de'=>'Germany','fr'=>'France'];
                    ?>
                    <div class="pg-card">
                        <h2>Phone Field Settings</h2>
                        <form id="pg-settings-form">
                            <table style="width: 100%; font-size: 14px; border-collapse: separate; border-spacing: 0 12px;">
                                <tr>
                                    <td style="padding: 8px 0; color: var(--pg-text-lt); vertical-align: middle;">Enable Phone Country Field</td>
                                    <td><label style="display:flex;align-items:center;gap:10px;cursor:pointer;"><input type="hidden" name="phone_enabled" value="0"><input type="checkbox" name="phone_enabled" value="1" <?php checked($phone_on); ?> style="width:18px;height:18px;accent-color:var(--pg-primary);"> <span style="font-weight:700;"><?php echo $phone_on ? 'Active' : 'Inactive'; ?></span></label></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: var(--pg-text-lt); vertical-align: middle;">Default Country</td>
                                    <td>
                                        <select name="default_country" style="padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;min-width:220px;background:#f8fafc;">
                                            <?php foreach ($cc_opts as $code => $name): ?>
                                                <option value="<?php echo $code; ?>" <?php selected($def_cc, $code); ?>><?php echo esc_html($name . ' (' . strtoupper($code) . ')'); ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    </td>
                                </tr>
                            </table>
                            <button type="submit" class="pg-btn pg-btn-primary" style="margin-top:10px;">Save Changes</button>
                        </form>
                    </div>

                    <div class="pg-card">
                        <h2>Plugin Info</h2>
                        <table style="width: 100%; font-size: 14px;">
                            <tr><td style="padding: 8px 0; color: var(--pg-text-lt);">Version</td><td style="font-weight: 700;"><?php echo PENGOO_WOO_VERSION; ?></td></tr>
                            <tr><td style="padding: 8px 0; color: var(--pg-text-lt);">Status</td><td style="font-weight: 700;"><span style="color:#16a34a;">● Connected</span></td></tr>
                            <tr><td style="padding: 8px 0; color: var(--pg-text-lt);">Store</td><td style="font-weight: 700;" dir="ltr"><?php echo esc_html($store_url); ?></td></tr>
                        </table>
                    </div>

                <?php else: ?>
                    <!-- Not Connected State -->
                    <div class="pg-card pg-hero">
                        <h1>Boost Sales with WhatsApp</h1>
                        <p>Connect your WooCommerce store to automatically send order confirmations, status updates and tracking alerts via WhatsApp.</p>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <button id="pg-connect-btn" class="pg-btn pg-btn-primary">Connect Store to Pengoo</button>
                            <a href="https://pengoo.io" target="_blank" class="pg-btn pg-btn-ghost" style="text-decoration:none;">Learn More</a>
                        </div>
                    </div>

                    <div class="pg-card">
                        <h2>How It Works</h2>
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <?php
                            $steps = [
                                ['1', 'Click Connect', 'We auto-generate secure API keys for your store.', '#2e69ff'],
                                ['2', 'Authorize on Pengoo', 'Complete the 1-click authorization on the Pengoo platform.', '#8b5cf6'],
                                ['3', 'Start Messaging', 'Your store events trigger automatic WhatsApp messages!', '#10b981'],
                            ];
                            foreach ($steps as $s): ?>
                                <div style="display: flex; gap: 16px; align-items: flex-start;">
                                    <div style="width: 40px; height: 40px; border-radius: 12px; background: <?php echo $s[3]; ?>; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0;"><?php echo $s[0]; ?></div>
                                    <div>
                                        <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 800;"><?php echo $s[1]; ?></h4>
                                        <p style="margin: 0; font-size: 13px; color: var(--pg-text-lt);"><?php echo $s[2]; ?></p>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Features Tab -->
            <div id="pg-features" class="pg-tab-content">
                <div class="pg-card">
                    <h2>Powered by Pengoo</h2>
                    <p>Everything you need to engage customers via WhatsApp, built right into your store.</p>
                </div>
                <div class="pg-features">
                    <?php
                    $features = [
                        ['📦', '#eef2ff', 'Order Notifications', 'Automatic WhatsApp alerts for every order status change.'],
                        ['📱', '#f0fdf4', 'OTP Verification', 'Secure checkout with WhatsApp-based OTP for COD orders.'],
                        ['💬', '#fefce8', 'WhatsApp Chat Button', 'Floating WhatsApp button on your storefront.'],
                        ['🔗', '#fdf2f8', 'Smart Webhooks', 'Real-time event sync without polling your store.'],
                        ['📊', '#f5f3ff', 'Analytics Dashboard', 'Track message delivery, open rates from Pengoo dashboard.'],
                        ['🌍', 'var(--pg-bg)', 'International Phone', 'Country-code-aware phone field on checkout.'],
                    ];
                    foreach ($features as $f): ?>
                        <div class="pg-feature">
                            <div class="pg-feature-icon" style="background: <?php echo $f[1]; ?>;"><?php echo $f[0]; ?></div>
                            <h4><?php echo $f[2]; ?></h4>
                            <p><?php echo $f[3]; ?></p>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>



            <footer class="pg-footer">
                <p>&copy; <?php echo date('Y'); ?> Pengoo.io — The Ultimate WhatsApp Automation Engine</p>
            </footer>
        </div>
        <?php
    }
}

// ══════════════════════════════════════════════════════════════
// 5. Plugin Init
// ══════════════════════════════════════════════════════════════
function pengoo_woo_init() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error"><p><strong>Pengoo WooCommerce Connector</strong> requires WooCommerce to be installed and active.</p></div>';
        });
        return;
    }
    new Pengoo_API();
    new Pengoo_Hooks();
    new Pengoo_Checkout();
    if (is_admin()) {
        new Pengoo_Admin();
    }
}
add_action('plugins_loaded', 'pengoo_woo_init');

// Plugin action links
add_filter('plugin_action_links_' . PENGOO_WOO_BASENAME, function($links) {
    $settings = '<a href="' . admin_url('admin.php?page=pengoo-connector') . '">Settings</a>';
    $connect  = '<a href="' . admin_url('admin.php?page=pengoo-connector') . '" style="color:#2e69ff;font-weight:bold;">Connect now</a>';
    array_unshift($links, $connect, $settings);
    return $links;
});
