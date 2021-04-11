import { Request, Response } from "express";
import { validationResult } from "express-validator";
import {
	Body,
	HeaderParam,
	JsonController,
	Post,
	Req,
	Res
} from "routing-controllers";
import { IUser } from "../interfaces";
import { SessionModel, UserModel } from "../models";
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
			.findOne({ email: userData.email })
			.exec()
			.then((existingUser) => {
				if (existingUser) {
					return res
						.status(400)
						.json({ error: "Пользователь уже существует" });
				}

				return (
					user
						.save()
						.then((user) =>
							res
								.status(200)
								.json({ status: "Пользователь успешно создан" })
						)
						// FIXME: Отправлять человекочитаемую ошибку
						.catch((error) => res.status(400).json({ error }))
				);
			})
			// FIXME: Собственная ошибка
			.catch((err) => err);
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
			.exec()
			.then((existingUser) => {
				if (!existingUser) {
					return res.status(401).json({
						error:
							"Пользователя с таким логином/почтой не существует"
					});
				}

				if (existingUser.validatePassword(userData.password)) {
					{
						const tokenPair = existingUser.generateTokenPair();
						// TODO: Прилинковать модели, хранить сессии у конкретного пользователя
						// Создаем сессию и сохраняем её в БД
						return new this.sessionModel({
							refreshToken: tokenPair.refreshToken
						})
							.save()
							.then(() => {
								return res.status(200).json({
									status: "Успешный вход",
									...tokenPair
								});
							})
							.catch(() => {
								return res.status(401).json({
									error: "Ошибка при входе"
								});
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
			return res.status(400).json();
		}

		return await this.sessionModel
			.findOne({ refreshToken })
			.exec()
			.then((existingSession) => {
				if (!existingSession) {
					return res.status(401).json();
				}

				try {
					const accessToken = existingSession.refreshAccessToken();
					return res.status(200).json({
						accessToken
					});
				} catch (error) {
					return res.status(401).json();
				}
			});
	}

	@Post("/logout")
	public async logout(
		@HeaderParam("x-refresh-token") refreshToken: string,
		@Res() res: Response
	): Promise<any> {
		if (!refreshToken) {
			return res.status(400).json();
		}

		return await this.sessionModel
			.findOneAndDelete({ refreshToken })
			.exec()
			.then((existingSession) => {
				if (!existingSession) {
					return res.status(401).json();
				}

				return res.status(200).json();
			});
	}
}
