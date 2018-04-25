#include "crypto_generichash_wrap.h"
#include "macros.h"

static Nan::Persistent<v8::FunctionTemplate> crypto_generichash_constructor;

CryptoGenericHashWrap::CryptoGenericHashWrap () {}

CryptoGenericHashWrap::~CryptoGenericHashWrap () {}

NAN_METHOD(CryptoGenericHashWrap::New) {
  CryptoGenericHashWrap* obj = new CryptoGenericHashWrap();
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CryptoGenericHashWrap::Update) {
  CryptoGenericHashWrap *self = Nan::ObjectWrap::Unwrap<CryptoGenericHashWrap>(info.This());
  ASSERT_BUFFER_SET_LENGTH(info[0], input)
  crypto_generichash_update(&(self->state), CDATA(input), input_length);
}

NAN_METHOD(CryptoGenericHashWrap::Final) {
  CryptoGenericHashWrap *self = Nan::ObjectWrap::Unwrap<CryptoGenericHashWrap>(info.This());
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_generichash_BYTES_MIN)
  crypto_generichash_final(&(self->state), CDATA(output), output_length);
}

void CryptoGenericHashWrap::Init () {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(CryptoGenericHashWrap::New);
  crypto_generichash_constructor.Reset(tpl);
  tpl->SetClassName(Nan::New("CryptoGenericHashWrap").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "update", CryptoGenericHashWrap::Update);
  Nan::SetPrototypeMethod(tpl, "final", CryptoGenericHashWrap::Final);
}

v8::Local<v8::Value> CryptoGenericHashWrap::NewInstance (unsigned char *key, unsigned long long key_length, unsigned long long output_length) {
  Nan::EscapableHandleScope scope;

  v8::Local<v8::Object> instance;

  v8::Local<v8::FunctionTemplate> constructorHandle = Nan::New<v8::FunctionTemplate>(crypto_generichash_constructor);
  instance = Nan::NewInstance(constructorHandle->GetFunction()).ToLocalChecked();

  CryptoGenericHashWrap *self = Nan::ObjectWrap::Unwrap<CryptoGenericHashWrap>(instance);
  crypto_generichash_init(&(self->state), key, key_length, output_length);

  return scope.Escape(instance);
}
