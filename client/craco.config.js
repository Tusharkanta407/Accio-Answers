module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        {
          module: /face-api\.js/,
          message: /Failed to parse source map/,
        },
        {
          module: /face-api\.js/,
          message: /Can't resolve 'fs'/,
        },
        {
          module: /face-api\.js/,
          message: /Can't resolve 'path'/,
        }
      ],
      resolve: {
        fallback: {
          fs: false,
          path: false,
          crypto: false,
          stream: false,
          buffer: false,
          util: false,
          assert: false,
          http: false,
          https: false,
          os: false,
          url: false,
          zlib: false,
          net: false,
          tls: false,
          dns: false,
          dgram: false,
          child_process: false,
          process: false,
          worker_threads: false,
          readline: false,
          querystring: false,
          punycode: false,
          string_decoder: false,
          timers: false,
          events: false,
          domain: false,
          constants: false,
          module: false,
          vm: false,
          inspector: false,
          perf_hooks: false,
          async_hooks: false,
          http2: false
        }
      }
    },
  },
  eslint: {
    configure: {
      rules: {
        'no-unused-vars': 'warn',
        'react-hooks/exhaustive-deps': 'warn'
      }
    }
  }
}; 