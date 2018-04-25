#include "crypto_onetimeauth_wrap.h"
#include "macros.h"

static Nan::Persistent<v8::FunctionTemplate> crypto_onetimeauth_constructor;

CryptoOnetimeAuthWrap::CryptoOnetimeAuthWrap () {}

CryptoOnetimeAuthWrap::~CryptoOnetimeAuthWrap () {}

NAN_METHOD(CryptoOnetimeAuthWrap::New) {
  CryptoOnetimeAuthWrap* obj = new CryptoOnetimeAuthWrap();
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CryptoOnetimeAuthWrap::Update) {
  CryptoOnetimeAuthWrap *self = Nan::ObjectWrap::Unwrap<CryptoOnetimeAuthWrap>(info.This());
  ASSERT_BUFFER_SET_LENGTH(info[0], input)
  crypto_onetimeauth_update(&(self->state), CDATA(input), input_length);
}

NAN_METHOD(CryptoOnetimeAuthWrap::Final) {
  CryptoOnetimeAuthWrap *self = Nan::ObjectWrap::Unwrap<CryptoOnetimeAuthWrap>(info.This());
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_onetimeauth_BYTES)
  crypto_onetimeauth_final(&(self->state), CDATA(output));
}

void CryptoOnetimeAuthWrap::Init () {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(CryptoOnetimeAuthWrap::New);
  crypto_onetimeauth_constructor.Reset(tpl);
  tpl->SetClassName(Nan::New("CryptoOnetimeAuthWrap").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "update", CryptoOnetimeAuthWrap::Update);
  Nan::SetPrototypeMethod(tpl, "final", CryptoOnetimeAuthWrap::Final);
}

v8::Local<v8::Value> CryptoOnetimeAuthWrap::NewInstance (unsigned char *key) {
  Nan::EscapableHandleScope scope;

  v8::Local<v8::Object> instance;

  v8::Local<v8::FunctionTemplate> constructorHandle = Nan::New<v8::FunctionTemplate>(crypto_onetimeauth_constructor);
  instance = Nan::NewInstance(constructorHandle->GetFunction()).ToLocalChecked();

  CryptoOnetimeAuthWrap *self = Nan::ObjectWrap::Unwrap<CryptoOnetimeAuthWrap>(instance);
  crypto_onetimeauth_init(&(self->state), key);

  return scope.Escape(instance);
}
