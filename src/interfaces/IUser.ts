import { Schema } from "mongoose";
import { ISessionDocument } from "src/models/session";

interface IUser {
	email: string;
	username: string;
	password: string;
	registrationDate: Date;
	sessions: (Schema.Types.ObjectId | ISessionDocument)[];
}

export default IUser;
