from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

def generate_vapid_keys():
    # Sinh khóa EC (Elliptic Curve) dùng đường cong prime256v1
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    # Xuất khóa Private dạng Base64 URL safe
    private_bytes = private_key.private_numbers().private_value.to_bytes(32, 'big')
    private_base64 = base64.urlsafe_b64encode(private_bytes).decode('utf-8').rstrip('=')

    # Xuất khóa Public dạng Base64 URL safe (uncompressed)
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    public_base64 = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')

    print(f"VAPID_PUBLIC_KEY = {public_base64}")
    print(f"VAPID_PRIVATE_KEY = {private_base64}")

if __name__ == "__main__":
    generate_vapid_keys()
