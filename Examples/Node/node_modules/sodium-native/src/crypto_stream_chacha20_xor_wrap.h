#ifndef CRYPTO_STREAM_CHACHA20_XOR_WRAP_H
#define CRYPTO_STREAM_CHACHA20_XOR_WRAP_H

#include <nan.h>
#include "../libsodium/src/libsodium/include/sodium.h"

class CryptoStreamChacha20XorWrap : public Nan::ObjectWrap {
public:
  unsigned char nonce[crypto_stream_chacha20_NONCEBYTES];
  unsigned char key[crypto_stream_chacha20_KEYBYTES];
  unsigned char next_block[64];
  int remainder;
  uint64_t block_counter;

  static void Init ();
  static v8::Local<v8::Value> NewInstance (unsigned char *nonce, unsigned char *key);
  CryptoStreamChacha20XorWrap ();
  ~CryptoStreamChacha20XorWrap ();

private:
  static NAN_METHOD(New);
  static NAN_METHOD(Update);
  static NAN_METHOD(Final);
};

#endif
