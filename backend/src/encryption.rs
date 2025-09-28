use aes_gcm::{
    aead::{Aead, KeyInit, OsRng, generic_array::GenericArray},
    Aes256Gcm, Nonce,
};
use anyhow::Result;

const NONCE_SIZE: usize = 12;

pub fn encrypt_metadata(key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>> {
    let cipher = Aes256Gcm::new(GenericArray::from_slice(key));
    let nonce = Nonce::from_slice(&rand::random::<[u8; NONCE_SIZE]>()); // unique per message

    let mut encrypted = cipher.encrypt(nonce, plaintext)?;
    // Prepend nonce to ciphertext so it's available for decryption
    let mut output = nonce.to_vec();
    output.append(&mut encrypted);
    Ok(output)
}

pub fn decrypt_metadata(key: &[u8; 32], ciphertext: &[u8]) -> Result<Vec<u8>> {
    if ciphertext.len() < NONCE_SIZE {
        anyhow::bail!("Ciphertext too short");
    }
    let (nonce_bytes, encrypted) = ciphertext.split_at(NONCE_SIZE);

    let cipher = Aes256Gcm::new(GenericArray::from_slice(key));
    let nonce = Nonce::from_slice(nonce_bytes);
    let decrypted = cipher.decrypt(nonce, encrypted)?;

    Ok(decrypted)
}
