import { ISessionDocument } from "src/models/session";
import { IUser, IUserDocument, SessionModel, UserModel } from "../models";

export default class UserService {
	userModel = UserModel;
	sessionModel = SessionModel;

	createUser(userData: IUser): IUserDocument {
		return new this.userModel(userData);
	}

	findByCredentials(userData: IUser): Promise<IUserDocument | null> {
		return this.userModel
			.findOne({
				$or: [
					{ email: userData.email },
					{ username: userData.username }
				]
			})
			.exec();
	}

	findSession(refreshToken: string): Promise<ISessionDocument | null> {
		return this.sessionModel.findOne({ refreshToken });
	}

	removeSession(refreshToken: string): Promise<ISessionDocument | null> {
		return this.sessionModel.findOneAndRemove({ refreshToken });
	}
}
