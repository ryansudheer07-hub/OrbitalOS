// OrbitalOS property-based test example using proptest
// Add to your dev-dependencies: proptest = "1"

use proptest::prelude::*;
use argon2::{Argon2, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{SaltString, PasswordHash};

proptest! {
    #[test]
    fn password_hash_roundtrip(password in ".{8,64}") {
        let salt = SaltString::generate(&mut rand::thread_rng());
        let argon2 = Argon2::default();
        let hash = argon2.hash_password(password.as_bytes(), &salt).unwrap().to_string();
        let parsed = PasswordHash::new(&hash).unwrap();
        assert!(argon2.verify_password(password.as_bytes(), &parsed).is_ok());
    }
}
