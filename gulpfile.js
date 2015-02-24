var gulp = require('gulp'),
    stylus = require('gulp-stylus');


var paths = {
  styl: ['./static/stylus/*.styl']
};

gulp.task('styl', function () {
  gulp.src('./static/stylus/main.styl')
    .pipe(stylus({
      compress: true
    }))
    .pipe(gulp.dest('./static/css'));
});

gulp.task('watch', function() {

  gulp.watch(paths.styl, ['styl']);

});

gulp.task('run', ['styl', 'watch']);