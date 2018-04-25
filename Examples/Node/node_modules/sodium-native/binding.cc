#include <node.h>
#include <node_buffer.h>
#include <nan.h>
#include <sodium.h>
#include "src/crypto_generichash_wrap.h"
#include "src/crypto_onetimeauth_wrap.h"
#include "src/crypto_hash_sha256_wrap.h"
#include "src/crypto_hash_sha512_wrap.h"
#include "src/crypto_stream_xor_wrap.h"
#include "src/crypto_stream_chacha20_xor_wrap.h"
#include "src/crypto_secretstream_xchacha20poly1305_state_wrap.h"
#include "src/crypto_pwhash_async.cc"
#include "src/crypto_pwhash_str_async.cc"
#include "src/crypto_pwhash_str_verify_async.cc"
#include "src/macros.h"

// memory management

NAN_METHOD(sodium_memzero) {
  ASSERT_BUFFER(info[0], buf)

  sodium_memzero(CDATA(buf), CLENGTH(buf));
}

NAN_METHOD(sodium_mlock) {
  ASSERT_BUFFER(info[0], buf)

  CALL_SODIUM(sodium_mlock(CDATA(buf), CLENGTH(buf)))
}

NAN_METHOD(sodium_munlock) {
  ASSERT_BUFFER(info[0], buf)

  CALL_SODIUM(sodium_munlock(CDATA(buf), CLENGTH(buf)))
}

static void SodiumFreeCallback (char * data, void * hint) {
  sodium_free((void *) data);
}

NAN_GETTER(SodiumMemorySecureAccessor) {
  info.GetReturnValue().Set(Nan::True());
}

NAN_METHOD(sodium_malloc) {
  ASSERT_UINT_BOUNDS(info[0], size, 0, node::Buffer::kMaxLength)

  void* ptr = sodium_malloc(size);

  if (ptr == NULL) {
    Nan::ThrowError(ERRNO_EXCEPTION(errno));
    return;
  }

  v8::Local<v8::Object> buf = Nan::NewBuffer(
    (char *)ptr,
    size,
    SodiumFreeCallback,
    NULL
  ).ToLocalChecked();

  Nan::SetAccessor(buf, LOCAL_STRING("secure"), SodiumMemorySecureAccessor);

  info.GetReturnValue().Set(buf);
}

NAN_METHOD(sodium_mprotect_noaccess) {
  ASSERT_BUFFER(info[0], buf)

  CALL_SODIUM(sodium_mprotect_noaccess(node::Buffer::Data(buf)))
}

NAN_METHOD(sodium_mprotect_readonly) {
  ASSERT_BUFFER(info[0], buf)

  CALL_SODIUM(sodium_mprotect_readonly(node::Buffer::Data(buf)))
}

NAN_METHOD(sodium_mprotect_readwrite) {
  ASSERT_BUFFER(info[0], buf)

  CALL_SODIUM(sodium_mprotect_readwrite(node::Buffer::Data(buf)))
}

// randombytes

NAN_METHOD(randombytes_random) {
  info.GetReturnValue().Set(Nan::New(randombytes_random()));
}

NAN_METHOD(randombytes_uniform) {
  ASSERT_UINT_BOUNDS(info[0], upper_bound, 0, 0xffffffff)

  info.GetReturnValue().Set(Nan::New(randombytes_uniform(upper_bound)));
}

NAN_METHOD(randombytes_buf) {
  ASSERT_BUFFER(info[0], random)

  randombytes_buf(CDATA(random), CLENGTH(random));
}

NAN_METHOD(randombytes_buf_deterministic) {
  ASSERT_BUFFER(info[0], random)
  ASSERT_BUFFER_MIN_LENGTH(info[1], seed, randombytes_seedbytes())

  randombytes_buf_deterministic(CDATA(random), CLENGTH(random), CDATA(seed));
}

// helpers

NAN_METHOD(sodium_memcmp) {
  ASSERT_BUFFER(info[0], b1)
  ASSERT_BUFFER(info[1], b2)
  ASSERT_UINT(info[2], length)

  CALL_SODIUM_BOOL(sodium_memcmp(CDATA(b1), CDATA(b2), length))
}

NAN_METHOD(sodium_compare) {
  ASSERT_BUFFER(info[0], b1)
  ASSERT_BUFFER(info[1], b2)
  ASSERT_UINT(info[2], length)

  info.GetReturnValue().Set(Nan::New<v8::Number>(sodium_compare(CDATA(b1), CDATA(b2), length)));
}

NAN_METHOD(sodium_pad) {
  ASSERT_BUFFER_SET_LENGTH(info[0], buf)
  ASSERT_UINT_BOUNDS(info[1], unpadded_buflen, 0, buf_length)
  ASSERT_UINT_BOUNDS(info[2], blocksize, 1, buf_length)

  uint32_t padded_buflen = 0;

  CALL_SODIUM(sodium_pad((size_t*) &padded_buflen, CDATA(buf), (size_t) unpadded_buflen, (size_t) blocksize, (size_t) buf_length))

  info.GetReturnValue().Set(Nan::New(padded_buflen));
}

NAN_METHOD(sodium_unpad) {
  ASSERT_BUFFER_SET_LENGTH(info[0], buf)
  ASSERT_UINT_BOUNDS(info[1], padded_buflen, 0, buf_length)
  ASSERT_UINT_BOUNDS(info[2], blocksize, 1, buf_length)

  uint32_t unpadded_buflen = 0;

  CALL_SODIUM(sodium_unpad((size_t*) &unpadded_buflen, CDATA(buf), (size_t) padded_buflen, (size_t) blocksize))

  info.GetReturnValue().Set(Nan::New(unpadded_buflen));
}

// crypto_kx

NAN_METHOD(crypto_kx_keypair) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], public_key, crypto_kx_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], secret_key, crypto_kx_secretkeybytes())

  CALL_SODIUM(crypto_kx_keypair(CDATA(public_key), CDATA(secret_key)))
}

NAN_METHOD(crypto_kx_seed_keypair) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], public_key, crypto_kx_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], secret_key, crypto_kx_secretkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], seed, crypto_kx_seedbytes())

  CALL_SODIUM(crypto_kx_seed_keypair(CDATA(public_key), CDATA(secret_key), CDATA(seed)))
}

NAN_METHOD(crypto_kx_client_session_keys) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], rx, crypto_kx_sessionkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], tx, crypto_kx_sessionkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], client_pk, crypto_kx_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], client_sk, crypto_kx_secretkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[4], server_pk, crypto_kx_publickeybytes())

  CALL_SODIUM(crypto_kx_client_session_keys(CDATA(rx), CDATA(tx), CDATA(client_pk), CDATA(client_sk), CDATA(server_pk)))
}

NAN_METHOD(crypto_kx_server_session_keys) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], rx, crypto_kx_sessionkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], tx, crypto_kx_sessionkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], server_pk, crypto_kx_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], server_sk, crypto_kx_secretkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[4], client_pk, crypto_kx_publickeybytes())

  CALL_SODIUM(crypto_kx_server_session_keys(CDATA(rx), CDATA(tx), CDATA(server_pk), CDATA(server_sk), CDATA(client_pk)))
}

// crypto_sign

NAN_METHOD(crypto_sign_seed_keypair) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], public_key, crypto_sign_publickeybytes());
  ASSERT_BUFFER_MIN_LENGTH(info[1], secret_key, crypto_sign_secretkeybytes());
  ASSERT_BUFFER_MIN_LENGTH(info[2], seed, crypto_sign_seedbytes());

  CALL_SODIUM(crypto_sign_seed_keypair(CDATA(public_key), CDATA(secret_key), CDATA(seed)))
}

NAN_METHOD(crypto_sign_keypair) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], public_key, crypto_sign_publickeybytes());
  ASSERT_BUFFER_MIN_LENGTH(info[1], secret_key, crypto_sign_secretkeybytes());

  CALL_SODIUM(crypto_sign_keypair(CDATA(public_key), CDATA(secret_key)))
}

NAN_METHOD(crypto_sign) {
  ASSERT_BUFFER_SET_LENGTH(info[1], message);
  ASSERT_BUFFER_MIN_LENGTH(info[0], signed_message, message_length + crypto_sign_bytes());
  ASSERT_BUFFER_MIN_LENGTH(info[2], secret_key, crypto_sign_secretkeybytes());

  unsigned long long signed_message_length_dummy;  // TODO: what is this used for?

  CALL_SODIUM(crypto_sign(CDATA(signed_message), &signed_message_length_dummy, CDATA(message), CLENGTH(message), CDATA(secret_key)))
}

NAN_METHOD(crypto_sign_open) {
  ASSERT_BUFFER_MIN_LENGTH(info[1], signed_message, crypto_sign_bytes());
  ASSERT_BUFFER_MIN_LENGTH(info[0], message, signed_message_length - crypto_sign_bytes());
  ASSERT_BUFFER_MIN_LENGTH(info[2], public_key, crypto_sign_publickeybytes());

  unsigned long long message_length_dummy;  // TODO: what is this used for?

  CALL_SODIUM_BOOL(crypto_sign_open(CDATA(message), &message_length_dummy, CDATA(signed_message), signed_message_length, CDATA(public_key)))
}

NAN_METHOD(crypto_sign_detached) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], signature, crypto_sign_bytes());
  ASSERT_BUFFER(info[1], message);
  ASSERT_BUFFER_MIN_LENGTH(info[2], secret_key, crypto_sign_secretkeybytes());

  unsigned long long signature_length_dummy; // TODO: what is this used for?

  CALL_SODIUM(crypto_sign_detached(CDATA(signature), &signature_length_dummy, CDATA(message), CLENGTH(message), CDATA(secret_key)))
}

NAN_METHOD(crypto_sign_ed25519_pk_to_curve25519) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], curve25519_pk, crypto_box_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], ed25519_pk, crypto_sign_publickeybytes())
  CALL_SODIUM(crypto_sign_ed25519_pk_to_curve25519(CDATA(curve25519_pk), CDATA(ed25519_pk)))
}

NAN_METHOD(crypto_sign_ed25519_sk_to_curve25519) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], curve25519_sk, crypto_box_secretkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], ed25519_sk, crypto_sign_secretkeybytes())
  CALL_SODIUM(crypto_sign_ed25519_sk_to_curve25519(CDATA(curve25519_sk), CDATA(ed25519_sk)))
}

NAN_METHOD(crypto_sign_verify_detached) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], signature, crypto_sign_bytes())
  ASSERT_BUFFER(info[1], message)
  ASSERT_BUFFER_MIN_LENGTH(info[2], public_key, crypto_sign_publickeybytes())

  CALL_SODIUM_BOOL(crypto_sign_verify_detached(CDATA(signature), CDATA(message), CLENGTH(message), CDATA(public_key)))
}

// crypto_generic_hash

NAN_METHOD(crypto_generichash) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_generichash_bytes_min())
  ASSERT_BUFFER(info[1], input)

  unsigned char *key_data = NULL;
  size_t key_len = 0;

  if (info[2]->IsObject()) {
    ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_generichash_keybytes_min())
    key_data = CDATA(key);
    key_len = key_length;
  }

  CALL_SODIUM(crypto_generichash(CDATA(output), CLENGTH(output), CDATA(input), CLENGTH(input), key_data, key_len))
}

NAN_METHOD(crypto_generichash_batch) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_generichash_bytes_min())

  unsigned char *key_data = NULL;
  size_t key_len = 0;

  if (info[2]->IsObject()) {
    ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_generichash_keybytes_min())
    key_data = CDATA(key);
    key_len = key_length;
  }

  if (!info[1]->IsArray()) {
    Nan::ThrowError("batch must be an array of buffers");
    return;
  }

  v8::Local<v8::Array> buffers = info[1].As<v8::Array>();

  crypto_generichash_state state;
  crypto_generichash_init(&state, key_data, key_len, output_length);

  uint32_t len = buffers->Length();
  for (uint32_t i = 0; i < len; i++) {
    v8::Local<v8::Value> buf = buffers->Get(i);
    if (!buf->IsObject()) {
      Nan::ThrowError("batch must be an array of buffers");
      return;
    }
    crypto_generichash_update(&state, CDATA(buf), CLENGTH(buf));
  }

  crypto_generichash_final(&state, CDATA(output), output_length);
}

NAN_METHOD(crypto_generichash_instance) {
  unsigned long long output_length = crypto_generichash_bytes();

  if (info[1]->IsObject()) {
    output_length = CLENGTH(info[1]->ToObject());
  } else if (info[1]->IsNumber()) {
    output_length = info[1]->Uint32Value();
  }

  if (info[0]->IsObject()) {
    ASSERT_BUFFER_MIN_LENGTH(info[0], key, crypto_generichash_keybytes_min())
    info.GetReturnValue().Set(CryptoGenericHashWrap::NewInstance(CDATA(key), key_length, output_length));
  } else {
    info.GetReturnValue().Set(CryptoGenericHashWrap::NewInstance(NULL, 0, output_length));
  }
}

// crypto_hash

NAN_METHOD(crypto_hash) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_hash_bytes())
  ASSERT_BUFFER(info[1], input)

  CALL_SODIUM(crypto_hash(CDATA(output), CDATA(input), CLENGTH(input)))
}

// crypto_box

NAN_METHOD(crypto_box_seed_keypair) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], public_key, crypto_box_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], secret_key, crypto_box_secretkeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], seed, crypto_box_seedbytes())

  CALL_SODIUM(crypto_box_seed_keypair(CDATA(public_key), CDATA(secret_key), CDATA(seed)))
}

NAN_METHOD(crypto_box_keypair) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], public_key, crypto_box_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], secret_key, crypto_box_secretkeybytes())

  CALL_SODIUM(crypto_box_keypair(CDATA(public_key), CDATA(secret_key)))
}

NAN_METHOD(crypto_box_detached) {
  ASSERT_BUFFER_SET_LENGTH(info[2], message)
  ASSERT_BUFFER_MIN_LENGTH(info[0], ciphertext, message_length)
  ASSERT_BUFFER_MIN_LENGTH(info[1], mac, crypto_box_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], nonce, crypto_box_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[4], public_key, crypto_box_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[5], secret_key, crypto_box_secretkeybytes())

  CALL_SODIUM(crypto_box_detached(
    CDATA(ciphertext), CDATA(mac), CDATA(message), message_length, CDATA(nonce), CDATA(public_key), CDATA(secret_key)
  ))
}

NAN_METHOD(crypto_box_easy) {
  ASSERT_BUFFER_SET_LENGTH(info[1], message)
  ASSERT_BUFFER_MIN_LENGTH(info[0], ciphertext, message_length + crypto_box_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], nonce, crypto_box_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], public_key, crypto_box_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[4], secret_key, crypto_box_secretkeybytes())

  CALL_SODIUM(crypto_box_easy(CDATA(ciphertext), CDATA(message), message_length, CDATA(nonce), CDATA(public_key), CDATA(secret_key)))
}

NAN_METHOD(crypto_box_open_detached) {
  ASSERT_BUFFER_SET_LENGTH(info[1], ciphertext)
  ASSERT_BUFFER_MIN_LENGTH(info[0], message, ciphertext_length)
  ASSERT_BUFFER_MIN_LENGTH(info[2], mac, crypto_box_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], nonce, crypto_box_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[4], public_key, crypto_box_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[5], secret_key, crypto_box_secretkeybytes())

  CALL_SODIUM_BOOL(crypto_box_open_detached(
    CDATA(message), CDATA(ciphertext), CDATA(mac), ciphertext_length, CDATA(nonce), CDATA(public_key), CDATA(secret_key)
  ))
}

NAN_METHOD(crypto_box_open_easy) {
  ASSERT_BUFFER_MIN_LENGTH(info[1], ciphertext, crypto_box_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[0], message, ciphertext_length - crypto_box_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], nonce, crypto_box_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], public_key, crypto_box_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[4], secret_key, crypto_box_secretkeybytes())

  CALL_SODIUM_BOOL(crypto_box_open_easy(
    CDATA(message), CDATA(ciphertext), ciphertext_length, CDATA(nonce), CDATA(public_key), CDATA(secret_key)
  ))
}

// crypto_box_seal

NAN_METHOD(crypto_box_seal) {
  ASSERT_BUFFER_SET_LENGTH(info[1], message)
  ASSERT_BUFFER_MIN_LENGTH(info[0], ciphertext, message_length + crypto_box_sealbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], public_key, crypto_box_publickeybytes())

  CALL_SODIUM(crypto_box_seal(CDATA(ciphertext), CDATA(message), message_length, CDATA(public_key)))
}

NAN_METHOD(crypto_box_seal_open) {
  ASSERT_BUFFER_SET_LENGTH(info[1], ciphertext)
  ASSERT_BUFFER_MIN_LENGTH(info[0], message, ciphertext_length - crypto_box_sealbytes())
  // according to libsodium docs, public key is not required here...
  // see: https://download.libsodium.org/doc/public-key_cryptography/sealed_boxes.html
  ASSERT_BUFFER_MIN_LENGTH(info[2], public_key, crypto_box_publickeybytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], secret_key, crypto_box_secretkeybytes())

  CALL_SODIUM_BOOL(crypto_box_seal_open(CDATA(message), CDATA(ciphertext), ciphertext_length, CDATA(public_key), CDATA(secret_key)))
}

// crypto_secretbox

NAN_METHOD(crypto_secretbox_detached) {
  ASSERT_BUFFER_SET_LENGTH(info[2], message)
  ASSERT_BUFFER_MIN_LENGTH(info[0], ciphertext, message_length)
  ASSERT_BUFFER_MIN_LENGTH(info[1], mac, crypto_secretbox_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], nonce, crypto_secretbox_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[4], key, crypto_secretbox_keybytes())

  CALL_SODIUM(crypto_secretbox_detached(CDATA(ciphertext), CDATA(mac), CDATA(message), message_length, CDATA(nonce), CDATA(key)))
}

NAN_METHOD(crypto_secretbox_easy) {
  ASSERT_BUFFER_SET_LENGTH(info[1], message)
  ASSERT_BUFFER_MIN_LENGTH(info[0], ciphertext, crypto_secretbox_macbytes() + message_length)
  ASSERT_BUFFER_MIN_LENGTH(info[2], nonce, crypto_secretbox_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], key, crypto_secretbox_keybytes())

  CALL_SODIUM(crypto_secretbox_easy(CDATA(ciphertext), CDATA(message), message_length, CDATA(nonce), CDATA(key)))
}

NAN_METHOD(crypto_secretbox_open_detached) {
  ASSERT_BUFFER_SET_LENGTH(info[1], ciphertext)
  ASSERT_BUFFER_MIN_LENGTH(info[0], message, ciphertext_length)
  ASSERT_BUFFER_MIN_LENGTH(info[2], mac, crypto_secretbox_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], nonce, crypto_secretbox_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[4], key, crypto_secretbox_keybytes())

  CALL_SODIUM_BOOL(crypto_secretbox_open_detached(CDATA(message), CDATA(ciphertext), CDATA(mac), ciphertext_length, CDATA(nonce), CDATA(key)))
}

NAN_METHOD(crypto_secretbox_open_easy) {
  ASSERT_BUFFER_MIN_LENGTH(info[1], ciphertext, crypto_secretbox_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[0], message, ciphertext_length - crypto_secretbox_macbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], nonce, crypto_secretbox_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], key, crypto_secretbox_keybytes())

  CALL_SODIUM_BOOL(crypto_secretbox_open_easy(CDATA(message), CDATA(ciphertext), ciphertext_length, CDATA(nonce), CDATA(key)))
}

// crypto_stream

NAN_METHOD(crypto_stream) {
  ASSERT_BUFFER(info[0], ciphertext)
  ASSERT_BUFFER_MIN_LENGTH(info[1], nonce, crypto_stream_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_stream_keybytes())

  CALL_SODIUM(crypto_stream(CDATA(ciphertext), CLENGTH(ciphertext), CDATA(nonce), CDATA(key)))
}

NAN_METHOD(crypto_stream_xor) {
  ASSERT_BUFFER_SET_LENGTH(info[1], message)
  ASSERT_BUFFER_MIN_LENGTH(info[0], ciphertext, message_length)
  ASSERT_BUFFER_MIN_LENGTH(info[2], nonce, crypto_stream_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], key, crypto_stream_keybytes())

  CALL_SODIUM(crypto_stream_xor(CDATA(ciphertext), CDATA(message), message_length, CDATA(nonce), CDATA(key)))
}

NAN_METHOD(crypto_stream_xor_instance) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], nonce, crypto_stream_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], key, crypto_stream_keybytes())

  info.GetReturnValue().Set(CryptoStreamXorWrap::NewInstance(CDATA(nonce), CDATA(key)));
}

NAN_METHOD(crypto_stream_chacha20_xor) {
  ASSERT_BUFFER_SET_LENGTH(info[1], message)
  ASSERT_BUFFER_MIN_LENGTH(info[0], ciphertext, message_length)
  ASSERT_BUFFER_MIN_LENGTH(info[2], nonce, crypto_stream_chacha20_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], key, crypto_stream_chacha20_keybytes())

  CALL_SODIUM(crypto_stream_chacha20_xor(CDATA(ciphertext), CDATA(message), message_length, CDATA(nonce), CDATA(key)))
}

NAN_METHOD(crypto_stream_chacha20_xor_instance) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], nonce, crypto_stream_chacha20_noncebytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], key, crypto_stream_chacha20_keybytes())

  info.GetReturnValue().Set(CryptoStreamChacha20XorWrap::NewInstance(CDATA(nonce), CDATA(key)));
}
// crypto_auth

NAN_METHOD(crypto_auth) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_auth_bytes())
  ASSERT_BUFFER(info[1], input)
  ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_auth_keybytes())

  CALL_SODIUM(crypto_auth(CDATA(output), CDATA(input), CLENGTH(input), CDATA(key)))
}

NAN_METHOD(crypto_auth_verify) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], hmac, crypto_auth_bytes())
  ASSERT_BUFFER(info[1], input)
  ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_auth_keybytes())

  CALL_SODIUM_BOOL(crypto_auth_verify(CDATA(hmac), CDATA(input), CLENGTH(input), CDATA(key)))
}

// crypto_onetimeauth

NAN_METHOD(crypto_onetimeauth) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_onetimeauth_bytes())
  ASSERT_BUFFER_SET_LENGTH(info[1], input)
  ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_onetimeauth_keybytes())

  CALL_SODIUM(crypto_onetimeauth(CDATA(output), CDATA(input), input_length, CDATA(key)))
}

NAN_METHOD(crypto_onetimeauth_verify) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_onetimeauth_bytes())
  ASSERT_BUFFER_SET_LENGTH(info[1], input)
  ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_onetimeauth_keybytes())

  CALL_SODIUM_BOOL(crypto_onetimeauth_verify(CDATA(output), CDATA(input), input_length, CDATA(key)))
}

NAN_METHOD(crypto_onetimeauth_instance) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], key, crypto_onetimeauth_keybytes())
  info.GetReturnValue().Set(CryptoOnetimeAuthWrap::NewInstance(CDATA(key)));
}

// crypto_pwhash

NAN_METHOD(crypto_pwhash) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_pwhash_bytes_min())
  ASSERT_BUFFER_MIN_LENGTH(info[1], password, crypto_pwhash_passwd_min())
  ASSERT_BUFFER_MIN_LENGTH(info[2], salt, crypto_pwhash_saltbytes())
  ASSERT_UINT_BOUNDS(info[3], opslimit, crypto_pwhash_opslimit_min(), crypto_pwhash_opslimit_max())
  ASSERT_UINT_BOUNDS(info[4], memlimit, crypto_pwhash_memlimit_min(), crypto_pwhash_memlimit_max())
  ASSERT_UINT(info[5], algo)

  CALL_SODIUM(crypto_pwhash(CDATA(output), output_length, (const char *) CDATA(password), password_length, CDATA(salt), opslimit, memlimit, algo))
}

NAN_METHOD(crypto_pwhash_str) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], hash, crypto_pwhash_strbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], password, crypto_pwhash_passwd_min())
  ASSERT_UINT_BOUNDS(info[2], opslimit, crypto_pwhash_opslimit_min(), crypto_pwhash_opslimit_max())
  ASSERT_UINT_BOUNDS(info[3], memlimit, crypto_pwhash_memlimit_min(), crypto_pwhash_memlimit_max())

  CALL_SODIUM(crypto_pwhash_str((char *) CDATA(hash), (const char *) CDATA(password), password_length, opslimit, memlimit))
}

NAN_METHOD(crypto_pwhash_str_verify) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], hash, crypto_pwhash_strbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], password, crypto_pwhash_passwd_min())

  CALL_SODIUM_BOOL(crypto_pwhash_str_verify((char *) CDATA(hash), (const char *) CDATA(password), password_length))
}

NAN_METHOD(crypto_pwhash_str_needs_rehash) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], hash, crypto_pwhash_strbytes())
  ASSERT_UINT_BOUNDS(info[1], opslimit, crypto_pwhash_opslimit_min(), crypto_pwhash_opslimit_max())
  ASSERT_UINT_BOUNDS(info[2], memlimit, crypto_pwhash_memlimit_min(), crypto_pwhash_memlimit_max())

  int ret = crypto_pwhash_str_needs_rehash((char *) CDATA(hash), opslimit, memlimit);
  info.GetReturnValue().Set(ret == 0 ? Nan::False() : Nan::True());
}

NAN_METHOD(crypto_pwhash_async) {
  ASSERT_BUFFER_SET_LENGTH(info[0], output)
  ASSERT_BUFFER_MIN_LENGTH(info[1], password, crypto_pwhash_passwd_min())
  ASSERT_BUFFER_MIN_LENGTH(info[2], salt, crypto_pwhash_saltbytes())
  ASSERT_UINT_BOUNDS(info[3], opslimit, crypto_pwhash_opslimit_min(), crypto_pwhash_opslimit_max())
  ASSERT_UINT_BOUNDS(info[4], memlimit, crypto_pwhash_memlimit_min(), crypto_pwhash_memlimit_max())
  ASSERT_UINT(info[5], algo)

  ASSERT_FUNCTION(info[6], callback)

  Nan::AsyncQueueWorker(new CryptoPwhashAsync(
    new Nan::Callback(callback),
    CDATA(output),
    output_length,
    (const char *) CDATA(password),
    password_length,
    CDATA(salt),
    opslimit,
    memlimit,
    algo
  ));
}

NAN_METHOD(crypto_pwhash_str_async) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], hash, crypto_pwhash_strbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], password, crypto_pwhash_passwd_min())
  ASSERT_UINT_BOUNDS(info[2], opslimit, crypto_pwhash_opslimit_min(), crypto_pwhash_opslimit_max())
  ASSERT_UINT_BOUNDS(info[3], memlimit, crypto_pwhash_memlimit_min(), crypto_pwhash_memlimit_max())

  ASSERT_FUNCTION(info[4], callback)

  Nan::AsyncQueueWorker(new CryptoPwhashStrAsync(
    new Nan::Callback(callback),
    (char *) CDATA(hash),
    (const char *) CDATA(password),
    password_length,
    opslimit,
    memlimit
  ));
}

NAN_METHOD(crypto_pwhash_str_verify_async) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], hash, crypto_pwhash_strbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], password, crypto_pwhash_passwd_min())

  ASSERT_FUNCTION(info[2], callback)

  Nan::AsyncQueueWorker(new CryptoPwhashStrVerifyAsync(
    new Nan::Callback(callback),
    (char *) CDATA(hash),
    (const char *) CDATA(password),
    password_length
  ));
}

// crypto_scalarmult

NAN_METHOD(crypto_scalarmult_base) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], public_key, crypto_scalarmult_bytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], secret_key, crypto_scalarmult_scalarbytes())

  CALL_SODIUM(crypto_scalarmult_base(CDATA(public_key), CDATA(secret_key)))
}

NAN_METHOD(crypto_scalarmult) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], shared_secret, crypto_scalarmult_bytes())
  ASSERT_BUFFER_MIN_LENGTH(info[1], secret_key, crypto_scalarmult_scalarbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], public_key, crypto_scalarmult_bytes())

  CALL_SODIUM(crypto_scalarmult(CDATA(shared_secret), CDATA(secret_key), CDATA(public_key)))
}

// crypto_shorthash

NAN_METHOD(crypto_shorthash) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_shorthash_bytes())
  ASSERT_BUFFER(info[1], input)
  ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_shorthash_keybytes())

  CALL_SODIUM(crypto_shorthash(CDATA(output), CDATA(input), CLENGTH(input), CDATA(key)))
}

// crypto_kdf

NAN_METHOD(crypto_kdf_keygen) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], key, crypto_kdf_keybytes())

  crypto_kdf_keygen(CDATA(key)); // void return value
}

NAN_METHOD(crypto_kdf_derive_from_key) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], subkey, crypto_kdf_bytes_min())
  ASSERT_UINT(info[1], subkey_id)
  ASSERT_BUFFER_MIN_LENGTH(info[2], context, crypto_kdf_contextbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[3], key, crypto_kdf_keybytes())

  CALL_SODIUM(crypto_kdf_derive_from_key(CDATA(subkey), subkey_length, subkey_id, (const char *) CDATA(context), CDATA(key)))
}

// crypto_hash_sha256

NAN_METHOD(crypto_hash_sha256) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_hash_sha256_bytes())
  ASSERT_BUFFER(info[1], input)

  CALL_SODIUM(crypto_hash_sha256(CDATA(output), CDATA(input), CLENGTH(input)))
}

NAN_METHOD(crypto_hash_sha256_instance) {
  info.GetReturnValue().Set(CryptoHashSha256Wrap::NewInstance());
}

// crypto_hash_sha512

NAN_METHOD(crypto_hash_sha512) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], output, crypto_hash_sha512_bytes())
  ASSERT_BUFFER(info[1], input)

  CALL_SODIUM(crypto_hash_sha512(CDATA(output), CDATA(input), CLENGTH(input)))
}

NAN_METHOD(crypto_hash_sha512_instance) {
  info.GetReturnValue().Set(CryptoHashSha512Wrap::NewInstance());
}

// crypto_secretstream

NAN_METHOD(crypto_secretstream_xchacha20poly1305_state_new) {
  info.GetReturnValue().Set(CryptoSecretstreamXchacha20poly1305StateWrap::NewInstance());
}

NAN_METHOD(crypto_secretstream_xchacha20poly1305_keygen) {
  ASSERT_BUFFER_MIN_LENGTH(info[0], key, crypto_secretstream_xchacha20poly1305_keybytes())

  crypto_secretstream_xchacha20poly1305_keygen(CDATA(key));
}

NAN_METHOD(crypto_secretstream_xchacha20poly1305_init_push) {
  ASSERT_UNWRAP(info[0], obj, CryptoSecretstreamXchacha20poly1305StateWrap)
  ASSERT_BUFFER_MIN_LENGTH(info[1], header, crypto_secretstream_xchacha20poly1305_headerbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_secretstream_xchacha20poly1305_keybytes())

  CALL_SODIUM(crypto_secretstream_xchacha20poly1305_init_push(&obj->state, CDATA(header), CDATA(key)))
}

NAN_METHOD(crypto_secretstream_xchacha20poly1305_push) {
  ASSERT_UNWRAP(info[0], obj, CryptoSecretstreamXchacha20poly1305StateWrap)
  ASSERT_BUFFER_SET_LENGTH(info[2], message)
  ASSERT_BUFFER_MIN_LENGTH(info[1], ciphertext, crypto_secretstream_xchacha20poly1305_abytes() + message_length)
  ASSERT_BUFFER_MIN_LENGTH(info[4], tag, crypto_secretstream_xchacha20poly1305_TAGBYTES)

  unsigned char *ad_data = NULL;
  size_t ad_len = 0;

  if (info[3]->IsObject()) {
    ASSERT_BUFFER_SET_LENGTH(info[3], ad)
    ad_data = CDATA(ad);
    ad_len = ad_length;
  }

  unsigned long long mlen;

  CALL_SODIUM(crypto_secretstream_xchacha20poly1305_push(&obj->state, CDATA(ciphertext), &mlen, CDATA(message), message_length, ad_data, ad_len, *CDATA(tag)));

  info.GetReturnValue().Set(Nan::New((uint32_t) mlen));
}

NAN_METHOD(crypto_secretstream_xchacha20poly1305_init_pull) {
  ASSERT_UNWRAP(info[0], obj, CryptoSecretstreamXchacha20poly1305StateWrap)
  ASSERT_BUFFER_MIN_LENGTH(info[1], header, crypto_secretstream_xchacha20poly1305_headerbytes())
  ASSERT_BUFFER_MIN_LENGTH(info[2], key, crypto_secretstream_xchacha20poly1305_keybytes())

  CALL_SODIUM(crypto_secretstream_xchacha20poly1305_init_pull(&obj->state, CDATA(header), CDATA(key)))
}

NAN_METHOD(crypto_secretstream_xchacha20poly1305_pull) {
  ASSERT_UNWRAP(info[0], obj, CryptoSecretstreamXchacha20poly1305StateWrap)
  ASSERT_BUFFER_SET_LENGTH(info[3], ciphertext)
  ASSERT_BUFFER_MIN_LENGTH(info[1], message, ciphertext_length - crypto_secretstream_xchacha20poly1305_abytes())

  unsigned char *ad_data = NULL;
  size_t ad_len = 0;

  if (info[4]->IsObject()) {
    ASSERT_BUFFER_SET_LENGTH(info[4], ad)
    ad_data = CDATA(ad);
    ad_len = ad_length;
  }

  unsigned char *tag_p = NULL;
  if (info[2]->IsObject()) {
    ASSERT_BUFFER(info[2], tag)
    tag_p = CDATA(tag);
  }

  unsigned long long clen = 0;

  CALL_SODIUM(crypto_secretstream_xchacha20poly1305_pull(&obj->state, CDATA(message), &clen, tag_p, CDATA(ciphertext), ciphertext_length, ad_data, ad_len));

  info.GetReturnValue().Set(Nan::New((uint32_t) clen));
}

NAN_METHOD(crypto_secretstream_xchacha20poly1305_rekey) {
  ASSERT_UNWRAP(info[0], obj, CryptoSecretstreamXchacha20poly1305StateWrap)

  crypto_secretstream_xchacha20poly1305_rekey(&obj->state);
}

NAN_MODULE_INIT(InitAll) {
  if (sodium_init() == -1) {
    Nan::ThrowError("sodium_init() failed");
    return;
  }

  // memory management
  EXPORT_FUNCTION(sodium_memzero)
  EXPORT_FUNCTION(sodium_mlock)
  EXPORT_FUNCTION(sodium_munlock)
  EXPORT_FUNCTION(sodium_malloc)
  EXPORT_FUNCTION(sodium_mprotect_noaccess)
  EXPORT_FUNCTION(sodium_mprotect_readonly)
  EXPORT_FUNCTION(sodium_mprotect_readwrite)

  // randombytes
  EXPORT_NUMBER_VALUE(randombytes_SEEDBYTES, randombytes_seedbytes())

  EXPORT_FUNCTION(randombytes_random)
  EXPORT_FUNCTION(randombytes_uniform)
  EXPORT_FUNCTION(randombytes_buf)
  EXPORT_FUNCTION(randombytes_buf_deterministic)

  // helpers

  EXPORT_FUNCTION(sodium_memcmp)
  EXPORT_FUNCTION(sodium_compare)

  // padding
  EXPORT_FUNCTION(sodium_pad)
  EXPORT_FUNCTION(sodium_unpad)

  // crypto_kx

  EXPORT_NUMBER_VALUE(crypto_kx_PUBLICKEYBYTES, crypto_kx_publickeybytes())
  EXPORT_NUMBER_VALUE(crypto_kx_SECRETKEYBYTES, crypto_kx_secretkeybytes())
  EXPORT_NUMBER_VALUE(crypto_kx_SEEDBYTES, crypto_kx_seedbytes())
  EXPORT_NUMBER_VALUE(crypto_kx_SESSIONKEYBYTES, crypto_kx_sessionkeybytes())
  EXPORT_STRING(crypto_kx_PRIMITIVE)

  EXPORT_FUNCTION(crypto_kx_keypair)
  EXPORT_FUNCTION(crypto_kx_seed_keypair)
  EXPORT_FUNCTION(crypto_kx_client_session_keys)
  EXPORT_FUNCTION(crypto_kx_server_session_keys)

  // crypto_sign

  EXPORT_NUMBER_VALUE(crypto_sign_SEEDBYTES, crypto_sign_seedbytes())
  EXPORT_NUMBER_VALUE(crypto_sign_PUBLICKEYBYTES, crypto_sign_publickeybytes())
  EXPORT_NUMBER_VALUE(crypto_sign_SECRETKEYBYTES, crypto_sign_secretkeybytes())
  EXPORT_NUMBER_VALUE(crypto_sign_BYTES, crypto_sign_bytes())

  EXPORT_FUNCTION(crypto_sign_seed_keypair)
  EXPORT_FUNCTION(crypto_sign_keypair)
  EXPORT_FUNCTION(crypto_sign)
  EXPORT_FUNCTION(crypto_sign_open)
  EXPORT_FUNCTION(crypto_sign_detached)
  EXPORT_FUNCTION(crypto_sign_verify_detached)
  EXPORT_FUNCTION(crypto_sign_ed25519_pk_to_curve25519)
  EXPORT_FUNCTION(crypto_sign_ed25519_sk_to_curve25519)

  // crypto_generic_hash

  EXPORT_STRING(crypto_generichash_PRIMITIVE)
  EXPORT_NUMBER_VALUE(crypto_generichash_BYTES_MIN, crypto_generichash_bytes_min())
  EXPORT_NUMBER_VALUE(crypto_generichash_BYTES_MAX, crypto_generichash_bytes_max())
  EXPORT_NUMBER_VALUE(crypto_generichash_BYTES, crypto_generichash_bytes())
  EXPORT_NUMBER_VALUE(crypto_generichash_KEYBYTES_MIN, crypto_generichash_keybytes_min())
  EXPORT_NUMBER_VALUE(crypto_generichash_KEYBYTES_MAX, crypto_generichash_keybytes_max())
  EXPORT_NUMBER_VALUE(crypto_generichash_KEYBYTES, crypto_generichash_keybytes())

  CryptoGenericHashWrap::Init();

  EXPORT_FUNCTION(crypto_generichash)
  EXPORT_FUNCTION(crypto_generichash_instance)
  EXPORT_FUNCTION(crypto_generichash_batch)

  // crypto_hash

  EXPORT_NUMBER_VALUE(crypto_hash_BYTES, crypto_hash_bytes())
  EXPORT_STRING(crypto_hash_PRIMITIVE)
  EXPORT_FUNCTION(crypto_hash)

  // crypto_box

  EXPORT_NUMBER_VALUE(crypto_box_SEEDBYTES, crypto_box_seedbytes())
  EXPORT_NUMBER_VALUE(crypto_box_PUBLICKEYBYTES, crypto_box_publickeybytes())
  EXPORT_NUMBER_VALUE(crypto_box_SECRETKEYBYTES, crypto_box_secretkeybytes())
  EXPORT_NUMBER_VALUE(crypto_box_NONCEBYTES, crypto_box_noncebytes())
  EXPORT_NUMBER_VALUE(crypto_box_MACBYTES, crypto_box_macbytes())
  EXPORT_STRING(crypto_box_PRIMITIVE)

  EXPORT_FUNCTION(crypto_box_seed_keypair)
  EXPORT_FUNCTION(crypto_box_keypair)
  EXPORT_FUNCTION(crypto_box_detached)
  EXPORT_FUNCTION(crypto_box_easy)
  EXPORT_FUNCTION(crypto_box_open_detached)
  EXPORT_FUNCTION(crypto_box_open_easy)

  // crypto_secretbox

  EXPORT_NUMBER_VALUE(crypto_secretbox_KEYBYTES, crypto_secretbox_keybytes())
  EXPORT_NUMBER_VALUE(crypto_secretbox_NONCEBYTES, crypto_secretbox_noncebytes())
  EXPORT_NUMBER_VALUE(crypto_secretbox_MACBYTES, crypto_secretbox_macbytes())
  EXPORT_STRING(crypto_secretbox_PRIMITIVE)

  EXPORT_NUMBER_VALUE(crypto_box_PUBLICKEYBYTES, crypto_box_publickeybytes())
  EXPORT_NUMBER_VALUE(crypto_box_SECRETKEYBYTES, crypto_box_secretkeybytes())
  EXPORT_NUMBER_VALUE(crypto_box_SEALBYTES, crypto_box_sealbytes())

  EXPORT_FUNCTION(crypto_box_seal)
  EXPORT_FUNCTION(crypto_box_seal_open)

  EXPORT_FUNCTION(crypto_secretbox_detached)
  EXPORT_FUNCTION(crypto_secretbox_easy)
  EXPORT_FUNCTION(crypto_secretbox_open_detached)
  EXPORT_FUNCTION(crypto_secretbox_open_easy)

  // crypto_stream

  CryptoStreamXorWrap::Init();
  CryptoStreamChacha20XorWrap::Init();

  EXPORT_NUMBER_VALUE(crypto_stream_KEYBYTES, crypto_stream_keybytes())
  EXPORT_NUMBER_VALUE(crypto_stream_NONCEBYTES, crypto_stream_noncebytes())
  EXPORT_STRING(crypto_stream_PRIMITIVE)

  EXPORT_NUMBER_VALUE(crypto_stream_chacha20_KEYBYTES, crypto_stream_chacha20_keybytes())
  EXPORT_NUMBER_VALUE(crypto_stream_chacha20_NONCEBYTES, crypto_stream_chacha20_noncebytes())


  EXPORT_FUNCTION(crypto_stream)
  EXPORT_FUNCTION(crypto_stream_xor)
  EXPORT_FUNCTION(crypto_stream_xor_instance)

  EXPORT_FUNCTION(crypto_stream_chacha20_xor)
  EXPORT_FUNCTION(crypto_stream_chacha20_xor_instance)

  // crypto_auth

  EXPORT_NUMBER_VALUE(crypto_auth_BYTES, crypto_auth_bytes())
  EXPORT_NUMBER_VALUE(crypto_auth_KEYBYTES, crypto_auth_keybytes())
  EXPORT_STRING(crypto_auth_PRIMITIVE)

  EXPORT_FUNCTION(crypto_auth)
  EXPORT_FUNCTION(crypto_auth_verify)

  // crypto_onetimeauth

  EXPORT_NUMBER_VALUE(crypto_onetimeauth_BYTES, crypto_onetimeauth_bytes())
  EXPORT_NUMBER_VALUE(crypto_onetimeauth_KEYBYTES, crypto_onetimeauth_keybytes())
  EXPORT_STRING(crypto_onetimeauth_PRIMITIVE)

  CryptoOnetimeAuthWrap::Init();

  EXPORT_FUNCTION(crypto_onetimeauth)
  EXPORT_FUNCTION(crypto_onetimeauth_verify)
  EXPORT_FUNCTION(crypto_onetimeauth_instance)

  // crypto_pwhash

  EXPORT_NUMBER_VALUE(crypto_pwhash_ALG_ARGON2I13, crypto_pwhash_alg_argon2i13())
  EXPORT_NUMBER_VALUE(crypto_pwhash_ALG_ARGON2ID13, crypto_pwhash_alg_argon2id13())
  EXPORT_NUMBER_VALUE(crypto_pwhash_ALG_DEFAULT, crypto_pwhash_alg_default())
  EXPORT_NUMBER_VALUE(crypto_pwhash_BYTES_MIN, crypto_pwhash_bytes_min())
  EXPORT_NUMBER_VALUE(crypto_pwhash_BYTES_MAX, crypto_pwhash_bytes_max())
  EXPORT_NUMBER_VALUE(crypto_pwhash_PASSWD_MIN, crypto_pwhash_passwd_min())
  EXPORT_NUMBER_VALUE(crypto_pwhash_PASSWD_MAX, crypto_pwhash_passwd_max())
  EXPORT_NUMBER_VALUE(crypto_pwhash_SALTBYTES, crypto_pwhash_saltbytes())
  EXPORT_NUMBER_VALUE(crypto_pwhash_STRBYTES, crypto_pwhash_strbytes())
  EXPORT_STRING(crypto_pwhash_STRPREFIX)
  EXPORT_NUMBER_VALUE(crypto_pwhash_OPSLIMIT_MIN, crypto_pwhash_opslimit_min())
  EXPORT_NUMBER_VALUE(crypto_pwhash_OPSLIMIT_MAX, crypto_pwhash_opslimit_max())
  EXPORT_NUMBER_VALUE(crypto_pwhash_MEMLIMIT_MIN, crypto_pwhash_memlimit_min())
  EXPORT_NUMBER_VALUE(crypto_pwhash_MEMLIMIT_MAX, crypto_pwhash_memlimit_max())
  EXPORT_NUMBER_VALUE(crypto_pwhash_OPSLIMIT_INTERACTIVE, crypto_pwhash_opslimit_interactive())
  EXPORT_NUMBER_VALUE(crypto_pwhash_MEMLIMIT_INTERACTIVE, crypto_pwhash_memlimit_interactive())
  EXPORT_NUMBER_VALUE(crypto_pwhash_OPSLIMIT_MODERATE, crypto_pwhash_opslimit_moderate())
  EXPORT_NUMBER_VALUE(crypto_pwhash_MEMLIMIT_MODERATE, crypto_pwhash_memlimit_moderate())
  EXPORT_NUMBER_VALUE(crypto_pwhash_OPSLIMIT_SENSITIVE, crypto_pwhash_opslimit_sensitive())
  EXPORT_NUMBER_VALUE(crypto_pwhash_MEMLIMIT_SENSITIVE, crypto_pwhash_memlimit_sensitive())
  EXPORT_STRING(crypto_pwhash_PRIMITIVE)

  EXPORT_FUNCTION(crypto_pwhash)
  EXPORT_FUNCTION(crypto_pwhash_str)
  EXPORT_FUNCTION(crypto_pwhash_str_verify)
  EXPORT_FUNCTION(crypto_pwhash_str_needs_rehash)

  EXPORT_FUNCTION(crypto_pwhash_async)
  EXPORT_FUNCTION(crypto_pwhash_str_async)
  EXPORT_FUNCTION(crypto_pwhash_str_verify_async)

  // crypto_scalarmult

  EXPORT_STRING(crypto_scalarmult_PRIMITIVE)
  EXPORT_NUMBER_VALUE(crypto_scalarmult_BYTES, crypto_scalarmult_bytes())
  EXPORT_NUMBER_VALUE(crypto_scalarmult_SCALARBYTES, crypto_scalarmult_scalarbytes())

  EXPORT_FUNCTION(crypto_scalarmult_base)
  EXPORT_FUNCTION(crypto_scalarmult)

  // crypto_shorthash

  EXPORT_NUMBER_VALUE(crypto_shorthash_BYTES, crypto_shorthash_bytes())
  EXPORT_NUMBER_VALUE(crypto_shorthash_KEYBYTES, crypto_shorthash_keybytes())
  EXPORT_STRING(crypto_shorthash_PRIMITIVE)

  EXPORT_FUNCTION(crypto_shorthash)

  // crypto_kdf

  EXPORT_NUMBER_VALUE(crypto_kdf_BYTES_MIN, crypto_kdf_bytes_min())
  EXPORT_NUMBER_VALUE(crypto_kdf_BYTES_MAX, crypto_kdf_bytes_max())
  EXPORT_NUMBER_VALUE(crypto_kdf_CONTEXTBYTES, crypto_kdf_contextbytes())
  EXPORT_NUMBER_VALUE(crypto_kdf_KEYBYTES, crypto_kdf_keybytes())
  EXPORT_STRING(crypto_kdf_PRIMITIVE)

  EXPORT_FUNCTION(crypto_kdf_keygen)
  EXPORT_FUNCTION(crypto_kdf_derive_from_key)

  // crypto_hash_256

  CryptoHashSha256Wrap::Init();

  EXPORT_NUMBER_VALUE(crypto_hash_sha256_BYTES, crypto_hash_sha256_bytes())
  EXPORT_FUNCTION(crypto_hash_sha256)
  EXPORT_FUNCTION(crypto_hash_sha256_instance)

  // crypto_hash_512

  CryptoHashSha512Wrap::Init();

  EXPORT_NUMBER_VALUE(crypto_hash_sha512_BYTES, crypto_hash_sha512_bytes())
  EXPORT_FUNCTION(crypto_hash_sha512)
  EXPORT_FUNCTION(crypto_hash_sha512_instance)

  // crypto_secretstream

  CryptoSecretstreamXchacha20poly1305StateWrap::Init();

  EXPORT_NUMBER_VALUE(crypto_secretstream_xchacha20poly1305_ABYTES, crypto_secretstream_xchacha20poly1305_abytes())
  EXPORT_NUMBER_VALUE(crypto_secretstream_xchacha20poly1305_HEADERBYTES, crypto_secretstream_xchacha20poly1305_headerbytes())
  EXPORT_NUMBER_VALUE(crypto_secretstream_xchacha20poly1305_KEYBYTES, crypto_secretstream_xchacha20poly1305_keybytes())
  EXPORT_NUMBER_VALUE(crypto_secretstream_xchacha20poly1305_MESSAGEBYTES_MAX, crypto_secretstream_xchacha20poly1305_messagebytes_max())
  // Unofficial constant
  EXPORT_NUMBER(crypto_secretstream_xchacha20poly1305_TAGBYTES)

  EXPORT_BYTE_TAG_AS_BUFFER(crypto_secretstream_xchacha20poly1305_TAG_MESSAGE)
  EXPORT_BYTE_TAG_AS_BUFFER(crypto_secretstream_xchacha20poly1305_TAG_PUSH)
  EXPORT_BYTE_TAG_AS_BUFFER(crypto_secretstream_xchacha20poly1305_TAG_REKEY)
  EXPORT_BYTE_TAG_AS_BUFFER(crypto_secretstream_xchacha20poly1305_TAG_FINAL)

  EXPORT_FUNCTION(crypto_secretstream_xchacha20poly1305_keygen)
  EXPORT_FUNCTION(crypto_secretstream_xchacha20poly1305_state_new)
  EXPORT_FUNCTION(crypto_secretstream_xchacha20poly1305_init_push)
  EXPORT_FUNCTION(crypto_secretstream_xchacha20poly1305_push)
  EXPORT_FUNCTION(crypto_secretstream_xchacha20poly1305_init_pull)
  EXPORT_FUNCTION(crypto_secretstream_xchacha20poly1305_pull)
  EXPORT_FUNCTION(crypto_secretstream_xchacha20poly1305_rekey)
}

NODE_MODULE(sodium, InitAll)

#undef EXPORT_FUNCTION
#undef EXPORT_NUMBER_VALUE
#undef EXPORT_NUMBER
#undef EXPORT_STRING
#undef LOCAL_FUNCTION
#undef LOCAL_STRING
#undef CDATA
#undef CLENGTH
#undef STR
#undef STR_HELPER
#undef ASSERT_BUFFER
#undef ASSERT_BUFFER_MIN_LENGTH
#undef ASSERT_BUFFER_SET_LENGTH
#undef ASSERT_UINT
#undef ASSERT_UINT_BOUNDS
#undef ASSERT_FUNCTION
#undef ASSERT_UNWRAP
#undef CALL_SODIUM
#undef CALL_SODIUM_BOOL
