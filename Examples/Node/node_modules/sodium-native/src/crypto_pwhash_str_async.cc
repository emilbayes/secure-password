#include <nan.h>
#include "macros.h"

#include "../libsodium/src/libsodium/include/sodium.h"

class CryptoPwhashStrAsync : public Nan::AsyncWorker {
 public:
  CryptoPwhashStrAsync(Nan::Callback *callback, char * out, const char * const passwd, unsigned long long passwdlen, unsigned long long opslimit, size_t memlimit)
    : Nan::AsyncWorker(callback), out(out), passwd(passwd), passwdlen(passwdlen), opslimit(opslimit), memlimit(memlimit) {}
  ~CryptoPwhashStrAsync() {}

  void Execute () {
    CALL_SODIUM_ASYNC_WORKER(errorno, crypto_pwhash_str(out, passwd, passwdlen, opslimit, memlimit))
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
  char * out;
  const char * const passwd;
  unsigned long long passwdlen;
  unsigned long long opslimit;
  size_t memlimit;
  int errorno;
};
