
const SALT = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || "nutribase-default-salt";

async function deriveKey(userId) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(userId + SALT),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(SALT),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function encryptData(data, userId) {
    const key = await deriveKey(userId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const plaintext = enc.encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        plaintext
    );

    return {
        encryptedData: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv),
    };
}


export async function decryptData(payload, userId) {
    const key = await deriveKey(userId);
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
    const ciphertext = base64ToArrayBuffer(payload.encryptedData);

    const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plaintext));
}
