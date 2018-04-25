#ifndef CRYPTO_HASH_SHA512_WRAP_H
#define CRYPTO_HASH_SHA512_WRAP_H

#include <nan.h>
#include "../libsodium/src/libsodium/include/sodium.h"

class CryptoHashSha512Wrap : public Nan::ObjectWrap {
public:
  static void Init ();
  static v8::Local<v8::Value> NewInstance ();
  CryptoHashSha512Wrap ();
  ~CryptoHashSha512Wrap ();

private:
  crypto_hash_sha512_state state;

  static NAN_METHOD(New);
  static NAN_METHOD(Update);
  static NAN_METHOD(Final);
};

#endif
