#include <nan.h>
#include "macros.h"

#include "../libsodium/src/libsodium/include/sodium.h"

class CryptoPwhashStrVerifyAsync : public Nan::AsyncWorker {
 public:
  CryptoPwhashStrVerifyAsync(Nan::Callback *callback, const char * str, const char * const passwd, unsigned long long passwdlen)
    : Nan::AsyncWorker(callback), str(str), passwd(passwd), passwdlen(passwdlen) {}
  ~CryptoPwhashStrVerifyAsync() {}

  void Execute () {
    if (crypto_pwhash_str_verify(str, passwd, passwdlen) < 0) {
      SetErrorMessage("crypto_pwhash_str_verify_async failed. Either the password is wrong or the operating system most likely refused to allocate the required memory");
      return;
    }
  }

  void HandleOKCallback () {
    Nan::HandleScope scope;

    v8::Local<v8::Value> argv[] = {
        Nan::Null(),
        Nan::True()
    };

    callback->Call(2, argv);
  }

  void HandleErrorCallback () {
    Nan::HandleScope scope;

    v8::Local<v8::Value> argv[] = {
        // Due to the way that crypto_pwhash_str_verify signals error different
        // from a verification mismatch, we will count all errors as mismatch.
        // The other possible error is wrong argument sizes, which is protected
        // by macros in binding.cc
        Nan::Null(),
        Nan::False()
    };

    callback->Call(2, argv);
  }

 private:
  const char * str;
  const char * const passwd;
  unsigned long long passwdlen;
};
