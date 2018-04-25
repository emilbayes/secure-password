#ifndef CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_STATE_WRAP_H
#define CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_STATE_WRAP_H

#include <nan.h>
#include "../libsodium/src/libsodium/include/sodium.h"

class CryptoSecretstreamXchacha20poly1305StateWrap : public Nan::ObjectWrap {
public:
  crypto_secretstream_xchacha20poly1305_state state;

  static void Init ();
  static v8::Local<v8::Value> NewInstance ();
  CryptoSecretstreamXchacha20poly1305StateWrap ();
  ~CryptoSecretstreamXchacha20poly1305StateWrap ();

private:
  static NAN_METHOD(New);

  static NAN_GETTER(GetK);
  static NAN_GETTER(GetNonce);
  static NAN_GETTER(GetPad);
};

#endif
