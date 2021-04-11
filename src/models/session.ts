import jwt from "jsonwebtoken";
import { Document, Model, model, Schema } from "mongoose";
import config from "../config";
import { ISession } from "../interfaces";

export interface ISessionDocument extends ISession, Document {
	refreshAccessToken: () => string;
}

export type ISessionModel = Model<ISessionDocument>;

const SessionSchema = new Schema<ISessionDocument>({
	refreshToken: {
		type: String,
		required: true
	}
});

SessionSchema.methods.refreshAccessToken = function (): string {
	const { refreshToken } = this;

	const payload = jwt.verify(refreshToken, config.server.jwtRefreshSecret, {
		complete: true
	}) as Record<string, unknown>;

	// Удаляем неунжную информацию о времени создания и действительности
	delete payload.iat;
	delete payload.ext;

	return jwt.sign(payload, config.server.jwtSecret, {
		expiresIn: "10m"
	});
};

const Session = model<ISessionDocument, ISessionModel>(
	"Session",
	SessionSchema
);

export default Session;
