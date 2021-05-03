import { Schema } from "mongoose";
import { ISessionDocument } from "../models/session";

interface IUser {
	email: string;
	username: string;
	password: string;
	favouriteCourses: Array<string>;
	viewedCourses: Array<string>;
	registrationDate: Date;
	sessions: (Schema.Types.ObjectId | ISessionDocument)[];
}

export default IUser;
