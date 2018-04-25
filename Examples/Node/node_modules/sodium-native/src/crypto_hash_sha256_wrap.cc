#include "crypto_hash_sha256_wrap.h"
#include "macros.h"

static Nan::Persistent<v8::FunctionTemplate> crypto_hash_sha256_constructor;

CryptoHashSha256Wrap::CryptoHashSha256Wrap () {}

CryptoHashSha256Wrap::~CryptoHashSha256Wrap () {}

NAN_METHOD(CryptoHashSha256Wrap::New) {
  CryptoHashSha256Wrap* obj = new CryptoHashSha256Wrap();
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CryptoHashSha256Wrap::Update) {
  CryptoHashSha256Wrap *self = Nan::ObjectWrap::Unwrap<CryptoHashSha256Wrap>(info.This());
  ASSERT_BUFFER_SET_LENGTH(info[0], input)
  crypto_hash_sha256_update(&(self->state), CDATA(input), input_length);
}

NAN_METHOD(CryptoHashSha256Wrap::Final) {
  CryptoHashSha256Wrap *self = Nan::ObjectWrap::Unwrap<CryptoHashSha256Wrap>(info.This());
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_hash_sha256_BYTES)
  crypto_hash_sha256_final(&(self->state), CDATA(output));
}

void CryptoHashSha256Wrap::Init () {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(CryptoHashSha256Wrap::New);
  crypto_hash_sha256_constructor.Reset(tpl);
  tpl->SetClassName(Nan::New("CryptoHashSha256Wrap").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "update", CryptoHashSha256Wrap::Update);
  Nan::SetPrototypeMethod(tpl, "final", CryptoHashSha256Wrap::Final);
}

v8::Local<v8::Value> CryptoHashSha256Wrap::NewInstance () {
  Nan::EscapableHandleScope scope;

  v8::Local<v8::Object> instance;

  v8::Local<v8::FunctionTemplate> constructorHandle = Nan::New<v8::FunctionTemplate>(crypto_hash_sha256_constructor);
  instance = Nan::NewInstance(constructorHandle->GetFunction()).ToLocalChecked();

  CryptoHashSha256Wrap *self = Nan::ObjectWrap::Unwrap<CryptoHashSha256Wrap>(instance);
  crypto_hash_sha256_init(&(self->state));

  return scope.Escape(instance);
}
