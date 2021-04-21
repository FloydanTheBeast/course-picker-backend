import { Document, Model, model, Schema } from "mongoose";
import { ISession } from "../interfaces";
import { IUserDocument } from "./user";

export interface ISessionDocument extends ISession, Document {}

export type ISessionModel = Model<ISessionDocument>;

const SessionSchema = new Schema<ISessionDocument>({
	refreshToken: {
		type: String,
		required: true
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: "User"
	}
});

SessionSchema.pre("remove", async function () {
	const session = this;

	await session.populate("user").execPopulate();

	if (session.user.sessions) {
		const user = session.user as IUserDocument;

		user.sessions = user.sessions.filter(
			(sessionEntry) => !session._id.equals(sessionEntry)
		);

		await user.save();
	}
});

const Session = model<ISessionDocument, ISessionModel>(
	"Session",
	SessionSchema
);

export default Session;
