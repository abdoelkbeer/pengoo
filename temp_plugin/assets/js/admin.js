/* Pengoo Admin JS - Premium Rebrand */
jQuery(document).ready(function($) {
    // Tab switching logic
    $('.pengoo-tab').on('click', function(e) {
        e.preventDefault();
        const target = $(this).data('tab');
        
        $('.pengoo-tab').removeClass('active');
        $(this).addClass('active');
        
        $('.pengoo-tab-content').fadeOut(200, function() {
            $(this).removeClass('active');
            $('#tab-' + target).addClass('active').fadeIn(200);
        });

        // Update URL hash
        window.location.hash = target;
    });

    // Handle button triggers to switch tabs
    $('.btn-tab-trigger').on('click', function(e) {
        e.preventDefault();
        const target = 'connect';
        $('.pengoo-tab[data-tab="' + target + '"]').trigger('click');
    });

    // Connect button logic
    $('#pengoo-connect-btn').on('click', function() {
        if (confirm('Authorize connection to Pengoo.io?')) {
            window.open(pengooVars.pengoo_app_url + '/dashboard?connect=' + encodeURIComponent(pengooVars.site_url), '_blank');
        }
    });

    // Settings form submission
    $('#pengoo-settings-form').on('submit', function(e) {
        e.preventDefault();
        const $btn = $(this).find('button[type="submit"]');
        const originalText = $btn.text();
        
        $btn.text('Saving...').prop('disabled', true);
        
        // Simulate AJAX save
        setTimeout(function() {
            $btn.text('Saved!').removeClass('secondary-btn').addClass('primary-btn');
            setTimeout(function() {
                $btn.text(originalText).removeClass('primary-btn').addClass('secondary-btn').prop('disabled', false);
            }, 2000);
        }, 1000);
    });

    // Handle hash on load
    const hash = window.location.hash.substring(1);
    if (hash && $('.pengoo-tab[data-tab="' + hash + '"]').length) {
        $('.pengoo-tab[data-tab="' + hash + '"]').trigger('click');
    }
});
