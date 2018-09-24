import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { uglify } from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const input = './index.js';
const external = ['react'];

const buildUMD = ({ env }) => ({
  input,
  external: external.concat(Object.keys(pkg.dependencies)),
  output: {
    name: 'react-forms',
    format: 'umd',
    sourcemap: true,
    file: `./dist/react-forms.umd.${env}.js`,
    exports: 'named',
    globals: {
      react: 'React'
    }
  },

  plugins: [
    resolve(),
    commonjs({
      include: /node_modules/
    }),
    replace({
      exclude: 'node_modules/**',
      'process.env.NODE_ENV': JSON.stringify(env)
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    sourceMaps(),
    env === 'production' && filesize(),
    env === 'production' &&
      uglify({
        output: { comments: false },
        compress: {
          keep_infinity: true,
          pure_getters: true
        },
        warnings: true,
        toplevel: false
      })
  ]
});

const buildCJS = ({ env }) => ({
  input,
  external: external.concat(Object.keys(pkg.dependencies)),
  output: [
    {
      file: `./dist/react-forms.cjs.${env}.js`,
      format: 'cjs',
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    commonjs({
      include: /node_modules/
    }),
    replace({
      exclude: 'node_modules/**',
      'process.env.NODE_ENV': JSON.stringify(env)
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    sourceMaps(),
    filesize(),
    env === 'production' &&
      uglify({
        output: { comments: false },
        compress: {
          keep_infinity: true,
          pure_getters: true
        },
        warnings: true,
        toplevel: false
      })
  ]
});

const buildEntry = () => ({
  input,
  external: external.concat(Object.keys(pkg.dependencies)),
  output: [
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    },
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    commonjs({
      include: /node_modules/
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    sourceMaps(),
    filesize()
  ]
});

export default [
  buildUMD({ env: 'production' }),
  buildUMD({ env: 'development' }),
  buildCJS({ env: 'production' }),
  buildCJS({ env: 'development' }),
  buildEntry()
];
