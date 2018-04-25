#include "crypto_hash_sha512_wrap.h"
#include "macros.h"

static Nan::Persistent<v8::FunctionTemplate> crypto_hash_sha512_constructor;

CryptoHashSha512Wrap::CryptoHashSha512Wrap () {}

CryptoHashSha512Wrap::~CryptoHashSha512Wrap () {}

NAN_METHOD(CryptoHashSha512Wrap::New) {
  CryptoHashSha512Wrap* obj = new CryptoHashSha512Wrap();
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CryptoHashSha512Wrap::Update) {
  CryptoHashSha512Wrap *self = Nan::ObjectWrap::Unwrap<CryptoHashSha512Wrap>(info.This());
  ASSERT_BUFFER_SET_LENGTH(info[0], input)
  crypto_hash_sha512_update(&(self->state), CDATA(input), input_length);
}

NAN_METHOD(CryptoHashSha512Wrap::Final) {
  CryptoHashSha512Wrap *self = Nan::ObjectWrap::Unwrap<CryptoHashSha512Wrap>(info.This());
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_hash_sha512_BYTES)
  crypto_hash_sha512_final(&(self->state), CDATA(output));
}

void CryptoHashSha512Wrap::Init () {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(CryptoHashSha512Wrap::New);
  crypto_hash_sha512_constructor.Reset(tpl);
  tpl->SetClassName(Nan::New("CryptoHashSha512Wrap").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "update", CryptoHashSha512Wrap::Update);
  Nan::SetPrototypeMethod(tpl, "final", CryptoHashSha512Wrap::Final);
}

v8::Local<v8::Value> CryptoHashSha512Wrap::NewInstance () {
  Nan::EscapableHandleScope scope;

  v8::Local<v8::Object> instance;

  v8::Local<v8::FunctionTemplate> constructorHandle = Nan::New<v8::FunctionTemplate>(crypto_hash_sha512_constructor);
  instance = Nan::NewInstance(constructorHandle->GetFunction()).ToLocalChecked();

  CryptoHashSha512Wrap *self = Nan::ObjectWrap::Unwrap<CryptoHashSha512Wrap>(instance);
  crypto_hash_sha512_init(&(self->state));

  return scope.Escape(instance);
}
