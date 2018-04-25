#ifndef CRYPTO_STREAM_XOR_WRAP_H
#define CRYPTO_STREAM_XOR_WRAP_H

#include <nan.h>
#include "../libsodium/src/libsodium/include/sodium.h"

class CryptoStreamXorWrap : public Nan::ObjectWrap {
public:
  unsigned char nonce[crypto_stream_NONCEBYTES];
  unsigned char key[crypto_stream_KEYBYTES];
  unsigned char next_block[64];
  int remainder;
  uint64_t block_counter;

  static void Init ();
  static v8::Local<v8::Value> NewInstance (unsigned char *nonce, unsigned char *key);
  CryptoStreamXorWrap ();
  ~CryptoStreamXorWrap ();

private:
  static NAN_METHOD(New);
  static NAN_METHOD(Update);
  static NAN_METHOD(Final);
};

#endif
