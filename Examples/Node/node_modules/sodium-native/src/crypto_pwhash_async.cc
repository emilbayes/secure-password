#include <nan.h>
#include "macros.h"

#include "../libsodium/src/libsodium/include/sodium.h"

class CryptoPwhashAsync : public Nan::AsyncWorker {
 public:
  CryptoPwhashAsync(Nan::Callback *callback, unsigned char * const out, unsigned long long outlen, const char * const passwd, unsigned long long passwdlen, const unsigned char * const salt, unsigned long long opslimit, size_t memlimit, int alg)
    : Nan::AsyncWorker(callback), out(out), outlen(outlen), passwd(passwd), passwdlen(passwdlen), salt(salt), opslimit(opslimit), memlimit(memlimit), alg(alg) {}
  ~CryptoPwhashAsync() {}

  void Execute () {
    CALL_SODIUM_ASYNC_WORKER(errorno, crypto_pwhash(out, outlen, passwd, passwdlen, salt, opslimit, memlimit, alg))
  }

  void HandleOKCallback () {
    Nan::HandleScope scope;

    v8::Local<v8::Value> argv[] = {
        Nan::Null()
    };

    callback->Call(1, argv);
  }

  void HandleErrorCallback () {
    Nan::HandleScope scope;

    v8::Local<v8::Value> argv[] = {
        ERRNO_EXCEPTION(errorno)
    };

    callback->Call(1, argv);
  }

 private:
  unsigned char * const out;
  unsigned long long outlen;
  const char * const passwd;
  unsigned long long passwdlen;
  const unsigned char * const salt;
  unsigned long long opslimit;
  size_t memlimit;
  int alg;
  int errorno;
};
