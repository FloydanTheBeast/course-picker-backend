import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Authorized, Body, Delete, Get, JsonController, Post, Req, Res } from "routing-controllers";
import { ICategory, ICourse, IUser } from "../interfaces";
import { CategoryModel, CourseModel, UserModel } from "../models";
import BaseController from "./BaseController";
import mongoose from "mongoose";

@JsonController("/users")
export default class UserController extends BaseController<IUser> {

	constructor() {
		super();
	}

	@Get("/favourite")
	@Authorized()
	public async getFavourite(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) {
			return res.status(401);
		}
		const data = jwt.decode(token);
		if (typeof data === "object" && data?.hasOwnProperty("id")) {
			const _id = data["id"];

			let findConditions: { [k: string]: any } = { _id: mongoose.Types.ObjectId(_id) },
				projection: { [k: string]: any } = {
					_id: 0,
					__v: 0,
					description: 0,
					reviews: 0,
					"favouriteCourses._id": 0,
					"favouriteCourses.categories._id": 0,
					"favouriteCourses.__v": 0,
					"viewedCourses._id": 0,
					"viewedCourses.categories._id": 0,
					"viewedCourses.__V": 0
				};


			let options: any[] = [{ $match: findConditions }];

			options.push({
				$lookup: {
					from: "courses",
					let: { "favouriteCourses": "$favouriteCourses" },
					pipeline: [
						{
							$match: { $expr: { $in: ["$id", "$$favouriteCourses"] } }
						},
						{
							$lookup: {
								from: "categories",
								localField: "categories",
								foreignField: "id",
								as: "categories"
							}
						},
						{
							$project: {
								_id: 0
							}
						}
					],
					as: "favouriteCourses"
				}
			});
			if (Object.keys(projection).length > 0) {
				options.push({ $project: projection });
			}
			console.log(options);
			return await UserModel
				.aggregate(options)
				.then(async (data) => {
					const dataObject: { [k: string]: IUser } = {};
					dataObject.favouriteCourses = data[0].favouriteCourses;

					return res.status(200).send(dataObject);
				});
		}
		return res.status(400).send({ error: "Проблема с JWT: отсутствует параметр id" });
	}

	@Post("/favourite")
	@Authorized()
	public async addFavourite(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		if (req.query.id) {

			const courseId = req.query.id.toString();
			return await CourseModel.findOne({ id: courseId }).then(async (existingCourse) => {
				if (existingCourse) {
					const token = req.headers["authorization"]?.split(" ")[1];
					if (!token) {
						return res.status(401);
					}
					const data = jwt.decode(token);
					if (typeof data === "object" && data?.hasOwnProperty("id")) {
						const _id = data["id"];
						return await UserModel.findOneAndUpdate({ _id: _id },
							{ $addToSet: { favouriteCourses: courseId } },
							{ returnOriginal: false }).then((user) => {
							return res.status(201).send({ favouriteCourses: user?.favouriteCourses });
						});
					}
					return res.status(400).send({ error: "Проблема с JWT: отсутствует параметр id" });
				} else {
					return res.status(404)
						.send({ error: "Не найден курс по переданному id" });
				}
			});
		} else {
			return res.status(400).send({ error: "Неправильный формат данных. Не представлен параметр 'id'" });
		}
	}

	@Delete("/favourite")
	@Authorized()
	public async deleteFavourite(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		if (req.query.id) {
			const courseId = req.query.id.toString();
			const token = req.headers["authorization"]?.split(" ")[1];
			if (!token) {
				return res.status(401);
			}
			const data = jwt.decode(token);
			if (typeof data === "object" && data?.hasOwnProperty("id")) {
				const _id = data["id"];
				return await UserModel.findOneAndUpdate({ _id: _id },
					{ $pull: { favouriteCourses: courseId } },
					{ returnOriginal: false }).then((user) => {
					return res.status(200).send({ favouriteCourses: user?.favouriteCourses });
				});
			}
			return res.status(400).send({ error: "Проблема с JWT: отсутствует параметр id" });
		} else {
			return res.status(400).send({ error: "Неправильный формат данных. Не представлен параметр 'id'" });
		}
	}

	@Get("/viewed")
	@Authorized()
	public async getViewed(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) {
			return res.status(401);
		}
		const data = jwt.decode(token);
		if (typeof data === "object" && data?.hasOwnProperty("id")) {
			const _id = data["id"];

			let findConditions: { [k: string]: any } = { _id: mongoose.Types.ObjectId(_id) },
				projection: { [k: string]: any } = {
					_id: 0,
					__v: 0,
					description: 0,
					reviews: 0,
					"favouriteCourses._id": 0,
					"favouriteCourses.categories._id": 0,
					"favouriteCourses.__v": 0,
					"viewedCourses._id": 0,
					"viewedCourses.categories._id": 0,
					"viewedCourses.__v": 0
				};


			let options: any[] = [{ $match: findConditions }];

			options.push({
				$lookup: {
					from: "courses",
					let: { "viewedCourses": "$viewedCourses" },
					pipeline: [
						{
							$match: { $expr: { $in: ["$id", "$$viewedCourses"] } }
						},
						{
							$lookup: {
								from: "categories",
								localField: "categories",
								foreignField: "id",
								as: "categories"
							}
						},
						{
							$project: {
								_id: 0
							}
						}
					],
					as: "viewedCourses"
				}
			});
			if (Object.keys(projection).length > 0) {
				options.push({ $project: projection });
			}

			return await UserModel
				.aggregate(options)
				.then(async (data) => {
					const dataObject: { [k: string]: IUser } = {};
					dataObject.viewedCourses = data[0].viewedCourses;

					return res.status(200).send(dataObject);
				});
		}
		return res.status(400).send({ error: "Проблема с JWT: отсутствует параметр id" });

	}

	@Post("/viewed")
	@Authorized()
	public async addViewed(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		if (req.query.id) {

			const courseId = req.query.id.toString();
			return await CourseModel.findOne({ id: courseId }).then(async (existingCourse) => {
				if (existingCourse) {
					const token = req.headers["authorization"]?.split(" ")[1];
					if (!token) {
						return res.status(401);
					}
					const data = jwt.decode(token);
					if (typeof data === "object" && data?.hasOwnProperty("id")) {
						const _id = data["id"];
						return await UserModel.findOneAndUpdate({ _id: _id },
							{ $addToSet: { viewedCourses: courseId } },
							{ returnOriginal: false }).then((user) => {
							return res.status(201).send({ viewedCourses: user?.viewedCourses });
						});
					}
					return res.status(400).send({ error: "Проблема с JWT: отсутствует параметр id" });
				} else {
					return res.status(404)
						.send({ error: "Не найден курс по переданному id" });
				}
			});
		} else {
			return res.status(400).send({ error: "Неправильный формат данных. Не представлен параметр 'id'" });
		}
	}

	@Delete("/viewed")
	@Authorized()
	public async deleteViewed(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {

		if (req.query.id) {
			const courseId = req.query.id.toString();
			const token = req.headers["authorization"]?.split(" ")[1];
			if (!token) {
				return res.status(401);
			}
			const data = jwt.decode(token);
			if (typeof data === "object" && data?.hasOwnProperty("id")) {
				const _id = data["id"];
				return await UserModel.findOneAndUpdate({ _id: _id },
					{ $pull: { viewedCourses: courseId } },
					{ returnOriginal: false }).then((user) => {
					return res.status(200).send({ viewedCourses: user?.viewedCourses });
				});
			}
			return res.status(400).send({ error: "Проблема с JWT: отсутствует параметр id" });
		} else {
			return res.status(400).send({ error: "Неправильный формат данных. Не представлен параметр 'id'" });
		}
	}

}
