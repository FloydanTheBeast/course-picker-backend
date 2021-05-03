import jwt from "jsonwebtoken";
import { Document, Model, model, Schema } from "mongoose";
import config from "../config";
import { IUser } from "../interfaces";
import { generateSalt, hashSHA512 } from "../utils/crypto";
import Session from "./session";

// TODO: Вынести в файл декларации
type accessToken = string;
type refreshToken = string;

type tokenPair = {
	accessToken: accessToken;
	refreshToken: refreshToken;
};

export interface IUserDocument extends IUser, Document {
	validatePassword: (otherPassword: string) => string;
	generateTokenPair: () => Promise<tokenPair>;
	refreshTokenPair: (refreshToken: string) => Promise<tokenPair>;
}

export type IUserModel = Model<IUserDocument>;

const UserSchema = new Schema<IUserDocument>({
	email: {
		type: String,
		unique: true
	},
	username: {
		type: String,
		unique: true
	},
	password: String,
	favouriteCourses: {
		type: Array,
		default: []
	},
	viewedCourses: {
		type: Array,
		default: []
	},
	registrationDate: {
		type: Date,
		default: Date.now
	},
	sessions: [
		{
			type: Schema.Types.ObjectId,
			ref: "Session"
		}
	]
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

UserSchema.methods.generateTokenPair = async function (): Promise<tokenPair | null> {
	const user = this;

	const tokens = {
		accessToken: jwt.sign(
			{
				email: user.email,
				username: user.username,
				id: user._id
			},
			config.server.jwtSecret,
			{
				expiresIn: config.server.tokenExpirationTime
			}
		),
		refreshToken: jwt.sign(
			{
				email: user.email,
				username: user.username,
				id: user._id
			},
			config.server.jwtRefreshSecret,
			{
				expiresIn: config.server.refreshTokenExpirationTime
			}
		)
	};

	return await new Session({
		refreshToken: tokens.refreshToken,
		user: user._id
	})
		.save()
		.then((session) => {
			user.sessions.push(session._id);
			return user.save().then(() => tokens);
		});
};

UserSchema.methods.refreshTokenPair = async function (
	refreshToken: string
): Promise<tokenPair> {
	const user = this;
	jwt.verify(refreshToken, config.server.jwtRefreshSecret);
	return await user.generateTokenPair();
};

UserSchema.methods.getRegistrationDate = function (): string {
	const user = this;
	return user.registrationDate.toLocaleDateString();
};

const User = model<IUserDocument, IUserModel>("User", UserSchema);

export default User;
