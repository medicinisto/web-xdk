/* eslint-disable */
import Layer from '../lib/index-all';


var APP_ID = 'layer:///apps/staging/2f1707c0-fd2f-11e6-ae72-c27751092ce1';
var PROVIDER_URL = 'https://layer-quickstart-michael.herokuapp.com';
var conversationPanel;

document.addEventListener('DOMContentLoaded', function() {
    conversationPanel = document.querySelector('layer-conversation-view');

    var client = window.client = new Layer.init({
      appId: APP_ID,
      isTrustedDevice: true
    });
    client.connect(localStorage.getItem('IDENTITY'));
    var first = true;
    client.on('challenge', function(evt) {
      var USER_ID = prompt('Enter Email Address');
      var PASSWORD = prompt('Enter Password');
      if (USER_ID && PASSWORD) {
        Layer.Utils.xhr({
          url: PROVIDER_URL + '/authenticate',
          headers: {
            'Content-type': 'application/json',
            'Accept': 'application/json',
          },
          method: 'POST',
          data: {
            nonce: evt.nonce,
            email: USER_ID,
            password: PASSWORD,
          },
        }, function(res) {
          if (res.success && res.data.identity_token) {
            console.log('challenge: ok');

            evt.callback(res.data.identity_token);
            localStorage.setItem('IDENTITY', client.user.userId);
          } else {
            alert('Login failed; please check your user id and password');
          }
        });
      } else if (first) {
        first = false;
        alert('Well, now your going to have to reload');
      }
    });

    client.on('ready', function() {
      var presenceWidget = document.querySelector('layer-presence');
      presenceWidget.item = client.user;
      presenceWidget.onPresenceClick = function(evt) {
        if (client.user.status === Layer.Core.Identity.STATUS.AVAILABLE) {
          client.user.setStatus(Layer.Core.Identity.STATUS.BUSY);
        } else {
          client.user.setStatus(Layer.Core.Identity.STATUS.AVAILABLE);
        }
      };

      var userNameDiv = document.querySelector('.user-name');
      userNameDiv.innerHTML = client.user.displayName || client.user.userId;
    });


});

