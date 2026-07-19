# Token Encryption & Vault Security

This document covers the server-side cryptographic encryption storage pattern for social media platform access and refresh credentials.

---

## 1. Cryptographic Standard (AES-256-GCM)
We use the **AES-256-GCM** (Galois/Counter Mode) authenticated symmetric encryption standard.
* **Authentication Tag**: Included in GCM to assert ciphertext integrity and key validity during decryption.
* **Initialization Vector (IV)**: A cryptographically secure random 12-byte nonce generated for every single token encryption. Identical plaintexts result in completely different ciphertexts.

---

## 2. Server-Side Key Isolation
* **Key Source**: Loaded from the server-only `TOKEN_ENCRYPTION_KEY` environment variable.
* **Derivation**: The key is hashed using **SHA-256** to derive a clean, cryptographically secure 32-byte key.
* **Rotation Ready**: The storage string is prefixed with a version ID (`v1:iv:tag:ciphertext`). This enables future key version mapping.

---

## 3. Vault Storage Design

### Database Table (`platform_credentials`)
To satisfy **Token Data Isolation**, credentials are saved in a separate table:
```sql
CREATE TABLE public.platform_credentials (
    connection_id UUID REFERENCES public.platform_connections(id) ON DELETE CASCADE PRIMARY KEY,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE
);
```

### Security Definer Protection
1. **No RLS Policies**: Clients cannot query `platform_credentials` directly (returns 0 rows).
2. **Postgres RPC Wrapper (`get_encrypted_credentials`)**:
   A security definer function checks company membership in the database and queries credentials only for authorized members.
   ```sql
   CREATE FUNCTION public.get_encrypted_credentials(p_connection_id UUID)
   SECURITY DEFINER ...
   ```
3. **Decryption boundary**: Plaintext tokens are decrypted **server-side only** (within actions or route handlers) and are never logged, returned in JSON browser requests, or stored in browser storage.
