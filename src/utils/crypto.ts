import * as crypto from "crypto";

export function generateSalt(length = 10): string {
	return crypto
		.randomBytes(Math.ceil(length))
		.toString("hex")
		.slice(0, length);
}

export function hashSHA512(str: string, salt: string): string {
	const hash = crypto.createHmac("sha512", salt);
	hash.update(str);

	return `${salt}$${hash.digest("hex")}`;
}
