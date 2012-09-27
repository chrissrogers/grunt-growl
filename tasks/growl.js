/*
 * grunt-growl
 * https://github.com/alextucker/grunt-growl
 *
 * Copyright (c) 2012 Alex Tucker
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  var growl = require('growl'),
      path = require('path'),
      messages = [],
      ignoreWatch = false;

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // SHARED FUNCTIONS
  // ==========================================================================

  function growlMessage(config) {
    growl(config.message, config);
  }

  function flushMessages(status) {
    if( messages.length <= 0 ) {
      return;
    }

    growlMessage({
      message: messages.join('\n'),
      title: 'Grunt',
      image: __dirname + '/../img/' + status + '.png'
    });
    messages = [];
  }

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('growl', 'Configure system notifications from your gruntfile', function() {
    growlMessage(this.data);
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  grunt.registerHelper('growl', function(config){
    growlMessage(config);
  });

  grunt.registerHelper('growlmock', function(mock){
    growlMessage = mock;
  });

  // ==========================================================================
  // DEFAULT NOTIFICATIONS
  // ==========================================================================

  function initGrowlStatus() {
    var handleWrite = function(msg){
          if( grunt.log.uncolor(msg).match(/Waiting.../) ) { flushMessages('ok'); }
        },
        handleHeader = function(msg){
          msg = grunt.log.uncolor(msg);

          if( ignoreWatch && msg.match(/"watch" task/) ) { return; }

          if( msg.match(/".+:.+"/) ) { return; }

          if( !ignoreWatch && msg.match(/"watch" task/) ) {
            msg += ' for ' + path.basename(process.cwd());
            ignoreWatch = true;
          }

          messages.unshift(msg);
        },
        handleOk = function(msg){
          if( typeof msg === 'string' ) {
           messages.unshift(grunt.log.uncolor(msg));
          }
        },
        handleError = function(msg){
          if( typeof msg === 'string' ) {
           messages.unshift(grunt.log.uncolor(msg));
           flushMessages('error');
          }
        },
        handleFail = function(error){
          var warning = [];

          if( typeof error !== 'undefined' ) {
            warning.unshift(messages[0]);
            warning.unshift(messages[messages.length-1]);
            warning.unshift(String(error.message || error));
            messages = warning;
            flushMessages('error');
          }
        };

    var suppress = grunt.config('growl.suppress') || [];

    if (!(suppress.indexOf('log') > -1)) {
      grunt.utils.hooker.hook(grunt.log, 'write', handleWrite);
      grunt.utils.hooker.hook(grunt.log, 'subhead', handleHeader);
      grunt.utils.hooker.hook(grunt.log, 'ok', handleOk);
      grunt.utils.hooker.hook(grunt.log, 'error', handleError);
    }

    if (!(suppress.indexOf('fail') > -1)) {
      grunt.utils.hooker.hook(grunt.fail, 'warn', handleFail);
      grunt.utils.hooker.hook(grunt.fail, 'fatal', handleFail);
    }
  }

  grunt.utils.hooker.hook(grunt, 'initConfig', {
    once: true,
    post: function(){
      if( grunt.config('growlstatus') !== false ) {
        initGrowlStatus();
      }
    }
  });

};
