#ifndef CRYPTO_HASH_SHA256_WRAP_H
#define CRYPTO_HASH_SHA256_WRAP_H

#include <nan.h>
#include "../libsodium/src/libsodium/include/sodium.h"

class CryptoHashSha256Wrap : public Nan::ObjectWrap {
public:
  static void Init ();
  static v8::Local<v8::Value> NewInstance ();
  CryptoHashSha256Wrap ();
  ~CryptoHashSha256Wrap ();

private:
  crypto_hash_sha256_state state;

  static NAN_METHOD(New);
  static NAN_METHOD(Update);
  static NAN_METHOD(Final);
};

#endif
