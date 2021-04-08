import mongoose from "mongoose";
import { IUser } from "../interfaces";
import { generateSalt, hashSHA512 } from "../utils/crypto";

export interface IUserDocument extends IUser, mongoose.Document {
	validatePassword: (otherPassword: string) => string;
}

const UserSchema = new mongoose.Schema<IUserDocument>({
	email: {
		type: String,
		unique: true
	},
	username: {
		type: String,
		unique: true
	},
	password: String,
	registrationDate: {
		type: Date,
		default: Date.now
	}
});

UserSchema.pre("save", function (next) {
	const user = this;

	if (!user.isDirectModified("password")) {
		return next();
	}

	const salt = generateSalt();

	// Изначально пароль не хешируется
	const hashedPassword = hashSHA512(user.password, salt);

	user.password = hashedPassword;
	return next();
});

UserSchema.methods.validatePassword = function (
	rawPassword: string | undefined
): boolean {
	if (!rawPassword) {
		return false;
	}

	const user = this;
	const salt = user.password.split("$")[0];

	return user.password === hashSHA512(rawPassword, salt);
};

UserSchema.methods.getRegistrationDate = function (): string {
	const user = this;
	return user.registrationDate.toLocaleDateString();
};

const user = mongoose.model<IUserDocument>("User", UserSchema);

export default user;
