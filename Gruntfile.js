'use strict';

module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.config('concat', {
    options: {
      banner: "+function () {\n'use strict';\n",
      process: function (src) {
        return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
      },
      footer: "window.MemePlayer = MemePlayer;\n}();"
    },
    dist: {
      src: [
        'src/MemePlayer.js'
      ],
      dest: 'dist/MemePlayer.js'
    },
    docs: {
      src: [
        'src/MemePlayer.js'
      ],
      dest: 'docs/player/MemePlayer.js'
    }
  });

  grunt.loadNpmTasks('grunt-jsdoc');
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

  grunt.loadNpmTasks('grunt-contrib-jshint');
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
      globals: {
        GIF: false
      }
    },
    main: {
      files: {
        src: ['src/**/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
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
    'concat',
    'uglify:dist',
    'jsdoc'
  ]);
};
