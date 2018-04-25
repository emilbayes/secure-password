#include "crypto_stream_chacha20_xor_wrap.h"
#include "macros.h"

static Nan::Persistent<v8::FunctionTemplate> crypto_stream_chacha20_xor_constructor;

static void crypto_stream_chacha20_xor_wrap_init (CryptoStreamChacha20XorWrap *self, unsigned char *nonce, unsigned char *key) {
  self->remainder = 0;
  self->block_counter = 0;
  memcpy(self->nonce, nonce, sizeof(self->nonce));
  memcpy(self->key, key, sizeof(self->key));
}

static void crypto_stream_chacha20_xor_wrap_update (CryptoStreamChacha20XorWrap *self, unsigned char *cipher, unsigned char *message, uint64_t message_length) {
  unsigned char *next_block = self->next_block;

  if (self->remainder) {
    uint64_t offset = 0;
    int rem = self->remainder;

    while (rem < 64 && offset < message_length) {
      cipher[offset] = next_block[rem] ^ 0 ^ message[offset];
      offset++;
      rem++;
    }

    cipher += offset;
    message += offset;
    message_length -= offset;
    self->remainder = rem == 64 ? 0 : rem;

    if (!message_length) return;
  }

  self->remainder = message_length & 63;
  message_length -= self->remainder;
  crypto_stream_chacha20_xor_ic(cipher, message, message_length, self->nonce, self->block_counter, self->key);
  self->block_counter += message_length / 64;

  if (self->remainder) {
    sodium_memzero(next_block + self->remainder, 64 - self->remainder);
    memcpy(next_block, message + message_length, self->remainder);

    crypto_stream_chacha20_xor_ic(next_block, next_block, 64, self->nonce, self->block_counter, self->key);
    memcpy(cipher + message_length, next_block, self->remainder);

    self->block_counter++;
  }
}

static void crypto_stream_chacha20_xor_wrap_final (CryptoStreamChacha20XorWrap *self) {
  sodium_memzero(self->nonce, sizeof(self->nonce));
  sodium_memzero(self->key, sizeof(self->key));
  sodium_memzero(self->next_block, sizeof(self->next_block));
  self->remainder = 0;
}

CryptoStreamChacha20XorWrap::CryptoStreamChacha20XorWrap () {

}

CryptoStreamChacha20XorWrap::~CryptoStreamChacha20XorWrap () {
  crypto_stream_chacha20_xor_wrap_final(this);
}

NAN_METHOD(CryptoStreamChacha20XorWrap::New) {
  CryptoStreamChacha20XorWrap* obj = new CryptoStreamChacha20XorWrap();
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CryptoStreamChacha20XorWrap::Update) {
  CryptoStreamChacha20XorWrap *self = Nan::ObjectWrap::Unwrap<CryptoStreamChacha20XorWrap>(info.This());
  ASSERT_BUFFER_SET_LENGTH(info[1], message)
  ASSERT_BUFFER_MIN_LENGTH(info[0], cipher, message_length)
  crypto_stream_chacha20_xor_wrap_update(self, CDATA(cipher), CDATA(message), message_length);
}

NAN_METHOD(CryptoStreamChacha20XorWrap::Final) {
  CryptoStreamChacha20XorWrap *self = Nan::ObjectWrap::Unwrap<CryptoStreamChacha20XorWrap>(info.This());
  crypto_stream_chacha20_xor_wrap_final(self);
}

void CryptoStreamChacha20XorWrap::Init () {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(CryptoStreamChacha20XorWrap::New);
  crypto_stream_chacha20_xor_constructor.Reset(tpl);
  tpl->SetClassName(Nan::New("CryptoStreamChacha20XorWrap").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "update", CryptoStreamChacha20XorWrap::Update);
  Nan::SetPrototypeMethod(tpl, "final", CryptoStreamChacha20XorWrap::Final);
}

v8::Local<v8::Value> CryptoStreamChacha20XorWrap::NewInstance (unsigned char *nonce, unsigned char *key) {
  Nan::EscapableHandleScope scope;

  v8::Local<v8::Object> instance;

  v8::Local<v8::FunctionTemplate> constructorHandle = Nan::New<v8::FunctionTemplate>(crypto_stream_chacha20_xor_constructor);
  instance = Nan::NewInstance(constructorHandle->GetFunction()).ToLocalChecked();

  CryptoStreamChacha20XorWrap *self = Nan::ObjectWrap::Unwrap<CryptoStreamChacha20XorWrap>(instance);
  crypto_stream_chacha20_xor_wrap_init(self, nonce, key);

  return scope.Escape(instance);
}
