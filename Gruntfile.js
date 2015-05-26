'use strict';

module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.initConfig({});

  grunt.config('browserify', {
    dist: {
      src: ['./bower-build.js'],
      dest: 'dist/MemePlayer.js'
    }
  });

  grunt.config('clean', {
    build: ['dist/']
  });

  grunt.config('jsdoc', {
    dist: {
      src: ['src/MemePlayer.js', 'README.md'],
      options: {
        destination: 'docs',
        template: 'template',
        configure: 'jsdoc.conf.json',
        private: false
      }
    }
  });

  grunt.config('jshint', {
    options: {
      bitwise: true,
      curly: true,
      eqeqeq: true,
      immed: true,
      indent: 2,
      newcap: true,
      undef: true,
      unused: true,
      trailing: true,
      globalstrict: true,
      browser: true,
      node: true,
      globals: {
        fetch: false
      }
    },
    main: {
      files: {
        src: ['src/**/*.js']
      }
    }
  });

  grunt.config('uglify', {
    options: {
      maxLineLen: 500
    },
    dist: {
      src: ['dist/MemePlayer.js'],
      dest: 'dist/MemePlayer.min.js'
    }
  });

  grunt.registerTask('default', [
    'clean',
    'browserify',
    'uglify:dist',
    'jsdoc'
  ]);
};
