import { Request, Response } from "express";
import { validationResult } from "express-validator";
import {
	Authorized,
	Body,
	HeaderParam,
	JsonController,
	Post,
	Req,
	Res
} from "routing-controllers";
import { IUser } from "../interfaces";
import { SessionModel, UserModel } from "../models";
import { IUserDocument } from "../models/user";
import BaseController from "./BaseController";

@JsonController("/auth")
export default class AuthController extends BaseController<IUser> {
	userModel = UserModel;
	sessionModel = SessionModel;

	constructor() {
		super();
	}

	@Post("/signup")
	public async create(
		@Body({ required: true }) userData: IUser,
		@Req() req: Request,
		@Res() res: Response
	): Promise<IUser | Response> {
		// TODO: Валидация данных
		// await body("password")
		// 	.isLength({ min: 5, max: 15 })
		// 	.withMessage("Пароль должен иметь длину от 5 до 15 символов")
		// 	.run(req);
		const validationErrors = await validationResult(req);
		// console.log(req);
		console.log(validationErrors.array());

		if (!validationErrors.isEmpty()) {
			// TODO: Выбрасывать собственную ошибку
			validationErrors.throw();
		}

		const user = new this.userModel(userData);

		return await this.userModel
			// TODO: Поиск по логину
			.findOne({
				$or: [
					{ email: userData.email },
					{ username: userData.username }
				]
			})
			.exec()
			.then((existingUser) => {
				if (existingUser) {
					return res
						.status(400)
						.json({ error: "Пользователь уже существует" });
				}

				return user
					.save()
					.then((user) =>
						res
							.status(200)
							.json({ status: "Пользователь успешно создан" })
					)
					.catch((error) => {
						throw error;
					});
			});
	}

	@Post("/signin")
	public async signin(
		@Body() userData: IUser,
		@Res() res: Response
	): Promise<any> {
		return await this.userModel
			.findOne({
				$or: [
					{ email: userData.email },
					{ username: userData.username }
				]
			})
			.then((existingUser) => {
				if (!existingUser) {
					return res.status(401).json({
						error:
							"Пользователя с таким логином/почтой не существует"
					});
				}

				if (existingUser.validatePassword(userData.password)) {
					{
						return existingUser
							.generateTokenPair()
							.then((tokenPair) => {
								return res.status(200).json({
									...tokenPair,
									user: {
										email: existingUser.email,
										username: existingUser.username
									}
								});
							})
							.catch((error) => {
								throw error;
							});
					}
				}

				return res.status(401).json({ error: "Неверный пароль" });
			});
	}

	@Post("/refresh-token")
	public async refreshToken(
		@HeaderParam("x-refresh-token") refreshToken: string,
		@Res() res: Response
	): Promise<any> {
		if (!refreshToken) {
			return res.status(400).json({ error: "Рефреш токен не указан" });
		}

		return await this.sessionModel
			.findOneAndRemove({ refreshToken })
			.then((existingSession) => {
				if (!existingSession) {
					return res.status(404).json({
						error: "Рефреш токен не найдён"
					});
				}

				return existingSession
					.populate("user")
					.execPopulate()
					.then(() => {
						const user = existingSession.user as IUserDocument;

						return user
							.refreshTokenPair(existingSession.refreshToken)
							.then((tokenPair) =>
								res.status(200).json({
									...tokenPair
								})
							)
							.catch(() =>
								res.status(401).json({
									error: "Рефреш токен недействителен"
								})
							);
					});
			});
	}

	@Post("/logout")
	public async logout(
		@HeaderParam("x-refresh-token") refreshToken: string,
		@Res() res: Response
	): Promise<any> {
		if (!refreshToken) {
			return res.status(400).json({
				error: "Рефреш токен не указан"
			});
		}

		return await this.sessionModel
			.findOne({ refreshToken })
			.then((existingSession) => {
				if (!existingSession) {
					return res.status(404).json({
						error: "Рефреш токен не найден"
					});
				}

				return existingSession.remove().then(() =>
					res.status(200).json({
						status: "Успешный выход"
					})
				);
			});
	}

	@Authorized()
	@Post("/auth-test")
	public async authTest(@Res() res: Response): Promise<any> {
		return res.status(200).jsonp({ status: "Success" });
	}
}
