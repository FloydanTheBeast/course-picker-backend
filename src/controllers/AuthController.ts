import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import {
	Authorized,
	Body,
	JsonController,
	Post,
	Req,
	Res
} from "routing-controllers";
import config from "../config";
import { IUser } from "../interfaces";
import UserModel from "../models/user";
import BaseController from "./BaseController";

@JsonController("/auth")
export default class AuthController extends BaseController<IUser> {
	userModel = UserModel;

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
						return res.status(200).json({
							status: "Успешный вход",
							accessToken: jwt.sign(
								{
									email: existingUser.email,
									username: existingUser.username,
									id: existingUser._id
								},
								config.server.jwtSecret,
								{ expiresIn: "10m" }
							)
						});
					}
				}

				return res.status(401).json({ error: "Неверный пароль" });
			});
	}

	@Authorized()
	@Post("/test")
	public async test(@Res() res: Response): Promise<any> {
		return res.status(200).json({ status: "Пользователь авторизован" });
	}
}
