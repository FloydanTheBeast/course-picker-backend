import { Schema } from "mongoose";
import { IUserDocument } from "src/models/user";

interface ISession {
	refreshToken: string;
	user: Schema.Types.ObjectId | IUserDocument;
}

export default ISession;
