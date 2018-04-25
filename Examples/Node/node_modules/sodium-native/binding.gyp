{
  'variables': {
    'target_arch%': '<!(node preinstall.js --print-arch)>'
  },
  'targets': [
    {
      'target_name': 'sodium',
      'include_dirs' : [
        "<!(node -e \"require('nan')\")",
        'libsodium/src/libsodium/include'
      ],
      'sources': [
        'binding.cc',
        'src/crypto_hash_sha256_wrap.cc',
        'src/crypto_hash_sha512_wrap.cc',
        'src/crypto_generichash_wrap.cc',
        'src/crypto_onetimeauth_wrap.cc',
        'src/crypto_stream_xor_wrap.cc',
        'src/crypto_stream_chacha20_xor_wrap.cc',
        'src/crypto_secretstream_xchacha20poly1305_state_wrap.cc',
        'src/crypto_pwhash_async.cc',
        'src/crypto_pwhash_str_async.cc',
        'src/crypto_pwhash_str_verify_async.cc',
      ],
      'xcode_settings': {
        'OTHER_CFLAGS': [
          '-g',
          '-O3',
        ]
      },
      'cflags': [
        '-g',
        '-O3',
      ],
      'libraries': [
        '<!(node preinstall.js --print-lib)'
      ],
      'conditions': [
        ['OS != "mac" and OS != "win"', {
          'link_settings': {
            'libraries': [ "-Wl,-rpath=\\$$ORIGIN"]
          }
        }],
      ],
    }
  ]
}
