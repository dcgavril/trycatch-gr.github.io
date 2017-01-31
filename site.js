$(document).ready(function() {
  hello.on('auth.login', function(auth) {
    window.FruumData = window.FruumData || [];
    //get basic info
    hello(auth.network).api('/me').then(function(r) {
      var user_payload = {
        network: auth.network,
        id: r.id,
        username: (r.login || r.name).replace(' ', '_').toLowerCase(),
        displayname: r.displayName || r.name,
        email: r.email || '',
        avatar: r.thumbnail
      }
      if (!r.email && auth.network === 'github') {
        //try to get email
        hello(auth.network).api('/user/emails').then(function(r2) {
          if (r2 && r2.data && r2.data.length) {
            _.each(r2.data, function(entry) {
              if (entry.email && entry.primary) {
                user_payload.email = entry.email;
              }
            });
          }
          window.FruumData.push({ user: user_payload });
          if (window.Fruum && window.Fruum.launch) window.Fruum.launch();
        });
      }
      else {
        window.FruumData.push({ user: user_payload });
        if (window.Fruum && window.Fruum.launch) window.Fruum.launch();
      }
    });
  });

  hello.init({
    github: (window.location.host == 'trycatch-gr.github.io')?'aa09b181bff047bf39fe':'95771edb728b79296278',
    facebook: '1063719947072749',
    google: '7831341199-pvsr4dfj2qioja0c2gbnrdh1q9aq7m8n.apps.googleusercontent.com'
  }, {redirect_uri: '/'});

  $('[data-auth]').click(function(event) {
    event.preventDefault();
    hello($(event.target).closest('[data-auth]').data('auth')).login({ scope: 'email' });
  });

  $('.js-subscribe').click(function(event) {
    event.preventDefault();
    Fruum.io.trigger('fruum:watch', { id: 'home' });
    $('.js-subscribe-group').fadeOut('fast');
  });

  $('.js-logout').click(function(event) {
    event.preventDefault();
    hello.logout();
    window.FruumData.push({ user: {} });
    $('.js-logout').addClass('is-hidden');
  });

  $('.js-share').click(function(event) {
    $('#share-modal').show();
    $('#share-modal input').removeAttr('disabled').focus();
    $('.js-please-wait').addClass('is-hidden');
  });

  $('#share-modal .close').click(function(event) {
    $('#share-modal').hide();
  });

  $('#share-modal input').keydown(function(event) {
    if (event.which == 13) {
      $('#share-modal input').attr('disabled', 'disabled');
      $('.js-please-wait').removeClass('is-hidden');
      var url = $('#share-modal input').val();
      event.preventDefault();
      event.stopPropagation();
      $.get('https://fruum.herokuapp.com/_/scrape?u=' + url).done(function(data) {
        var body = '',
            image = data.image || data.thumbnail || '',
            thumbnail = data.thumbnail || data.image || '';
        if (data.summary && data.summary.length > 1000) {
          data.summary = data.summary.substr(0, 1000) + '...';
        }
        if (image) {
          //body = '<img height="256" src="' + image + '"/>';
          body = '![image](' + image + ')\n\n';
        }
        if (data.description) {
          body += '[' + data.description + '](' + url + ')\n\n';
        }
        /*
        if (data.description && thumbnail) {
          body = '| <img width="200" src="' + thumbnail + '" /> | [' + data.description + '](' + url + ') |\n';
          body += '| ---- | ---- |\n\n';
        } else if (data.description) {
          body += data.description + '\n\n';
        }
        */
        if (data.summary) {
          body += '*' + data.summary + '*\n\n';
        }
        body += 'Διαβάστε το πλήρες άρθρο [εδώ](' + url + ').';
        Fruum.RootView.ui_state.set('editing', {
          type: 'thread',
          parent: 'home',
          header: data.title || '',
          body: body,
          thumbnail: thumbnail,
        });
      }).always(function() {
        $('#share-modal').hide();
        $('#share-modal input').val('');
      });
    }
  });
});

(function() {
  window.fruumLoaded = function() {
    if (Fruum.user.anonymous) {
      $('.js-subscribe-group').fadeOut('fast', function() {
        $('.js-login-group').fadeIn('fast');
        $('.js-logout').addClass('is-hidden');
      });
    } else {
      $('.js-login-group').fadeOut('fast', function() {
        $('.js-logout').removeClass('is-hidden');
        $('.js-share-group').fadeIn('fast');
        if (!Fruum.userUtils.isWatching('home')) {
          $('.js-subscribe-group').fadeIn('fast');
        }
      });
    }
  }
})();
