#include "crypto_secretstream_xchacha20poly1305_state_wrap.h"
#include "macros.h"

static Nan::Persistent<v8::FunctionTemplate> crypto_secretstream_xchacha20poly1305_state_constructor;

CryptoSecretstreamXchacha20poly1305StateWrap::CryptoSecretstreamXchacha20poly1305StateWrap () {}

CryptoSecretstreamXchacha20poly1305StateWrap::~CryptoSecretstreamXchacha20poly1305StateWrap () {}

NAN_METHOD(CryptoSecretstreamXchacha20poly1305StateWrap::New) {
  CryptoSecretstreamXchacha20poly1305StateWrap* obj = new CryptoSecretstreamXchacha20poly1305StateWrap();
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

void CryptoSecretstreamXchacha20poly1305StateWrap::Init () {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(CryptoSecretstreamXchacha20poly1305StateWrap::New);
  crypto_secretstream_xchacha20poly1305_state_constructor.Reset(tpl);
  tpl->SetClassName(Nan::New("CryptoSecretstreamXchacha20poly1305StateWrap").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  v8::Local<v8::ObjectTemplate> itpl = tpl->InstanceTemplate();

  Nan::SetAccessor(itpl, LOCAL_STRING("k"), GetK);
  Nan::SetAccessor(itpl, LOCAL_STRING("nonce"), GetNonce);
  Nan::SetAccessor(itpl, LOCAL_STRING("_pad"), GetPad);
}

v8::Local<v8::Value> CryptoSecretstreamXchacha20poly1305StateWrap::NewInstance () {
  Nan::EscapableHandleScope scope;

  v8::Local<v8::Object> instance;

  v8::Local<v8::FunctionTemplate> constructorHandle = Nan::New<v8::FunctionTemplate>(crypto_secretstream_xchacha20poly1305_state_constructor);
  instance = Nan::NewInstance(constructorHandle->GetFunction()).ToLocalChecked();

  return scope.Escape(instance);
}

NAN_GETTER(CryptoSecretstreamXchacha20poly1305StateWrap::GetK) {
  CryptoSecretstreamXchacha20poly1305StateWrap* obj = Nan::ObjectWrap::Unwrap<CryptoSecretstreamXchacha20poly1305StateWrap>(info.Holder());
  info.GetReturnValue().Set(Nan::NewBuffer((char *)obj->state.k, crypto_stream_chacha20_ietf_KEYBYTES).ToLocalChecked());
}

NAN_GETTER(CryptoSecretstreamXchacha20poly1305StateWrap::GetNonce) {
  CryptoSecretstreamXchacha20poly1305StateWrap* obj = Nan::ObjectWrap::Unwrap<CryptoSecretstreamXchacha20poly1305StateWrap>(info.Holder());
  info.GetReturnValue().Set(Nan::NewBuffer((char *)obj->state.nonce, crypto_stream_chacha20_ietf_NONCEBYTES).ToLocalChecked());
}

NAN_GETTER(CryptoSecretstreamXchacha20poly1305StateWrap::GetPad) {
  CryptoSecretstreamXchacha20poly1305StateWrap* obj = Nan::ObjectWrap::Unwrap<CryptoSecretstreamXchacha20poly1305StateWrap>(info.Holder());
  info.GetReturnValue().Set(Nan::NewBuffer((char *)obj->state._pad, 8).ToLocalChecked());
}
