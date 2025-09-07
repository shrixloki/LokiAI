use ethers::core::types::Signature;
use ethers::utils::hash_message;
use std::str::FromStr;

pub fn verify_wallet_signature(
    wallet_address: &str,
    signature: &str,
    message: &str,
) -> Result<bool, Box<dyn std::error::Error>> {
    let signature = Signature::from_str(signature)?;
    let message_hash = hash_message(message);
    let recovered_address = signature.recover(message_hash)?;
    let expected_address = wallet_address.to_lowercase();
    let recovered_address_str = format!("0x{:x}", recovered_address).to_lowercase();
    Ok(expected_address == recovered_address_str)
}
