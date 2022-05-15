import { Request, Response } from "express";
import { Authorized, Get, JsonController, Req, Res } from "routing-controllers";
import { ICourse } from "../interfaces";
import {
	CompilationModel,
	CourseModel,
	ReviewModel,
	UserModel
} from "../models";
import BaseController from "./BaseController";
import { objectToQueryString } from "../utils/urlencoder";
import jwt from "jsonwebtoken";
import { prepareOptionsByCourseId } from "../utils/courses";
import { IReviewDocument } from "../models/review";
import { CourseService } from "../services/CourseService";

@JsonController("/courses")
export default class CourseController extends BaseController<ICourse> {
	courseService: CourseService;

	constructor() {
		super();
		this.courseService = new CourseService();
	}

	@Get("/main")
	public async getCoursesMainPage(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		const dataObject = await this.courseService.getMainPageCourses();

		return res.status(200).send(dataObject);
	}

	@Get("/:id")
	@Authorized()
	public async getCourseById(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		const courseId = req.params.id;
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) {
			return res.status(401);
		}
		const data = jwt.decode(token);
		if (typeof data === "object" && data?.id) {
			const _id = data["id"];
			return await UserModel.findOne({ _id: _id }).then(
				async (existingUser) => {
					const favouriteCourses = new Set(
							existingUser?.favouriteCourses
						),
						viewedCourses = new Set(existingUser?.viewedCourses);
					const isFavourite = favouriteCourses?.has(courseId);
					const isViewed = viewedCourses?.has(courseId);

					const findConditions: { [k: string]: any } = {
							id: courseId
						},
						lookup: { [k: string]: any }[] = [
							{
								from: "categories",
								localField: "categories",
								foreignField: "id",
								as: "categories"
							}
						],
						projection: { [k: string]: any } = {
							_id: 0,
							__v: 0,
							"categories._id": 0
						};

					const options: any[] = [{ $match: findConditions }];
					if (lookup.length > 0) {
						for (const v of lookup) {
							options.push({ $lookup: v });
						}
					}
					if (Object.keys(projection).length > 0) {
						options.push({ $project: projection });
					}
					return await this.courseModel
						.aggregate(options)
						.then(async (data) => {
							const dataObject: { [k: string]: any } = {};
							dataObject.isFavourite = isFavourite;
							dataObject.isViewed = isViewed;
							dataObject.course = data[0];

							// Increment countViews
							await this.courseModel
								.updateOne(
									{ id: courseId },
									{ $inc: { countViews: 1 } }
								)
								.exec();

							return await UserModel.findOne({ _id: _id }).then(
								async (existingUser) => {
									if (existingUser) {
										const username = existingUser.username;
										const options = prepareOptionsByCourseId(
											courseId
										);

										return await ReviewModel.aggregate(
											options
										).then((reviews) => {
											reviews = reviews.sort((a, b) => {
												if (
													a.user.username == username
												) {
													return -1;
												} else if (
													b.user.username == username
												) {
													return 1;
												} else {
													return a.creationDate >=
														b.creationDate
														? a.creationDate ==
														  b.creationDate
															? 0
															: -1
														: 1;
												}
											});
											dataObject.course.reviews = reviews;
											return res
												.status(200)
												.send(dataObject);
										});
									}
									return res.status(400).send({
										error:
											"Непредвиденная ошибка: не найден пользователь, к которому привязан JWT токен"
									});
								}
							);
						});
				}
			);
		}
		return res
			.status(400)
			.send({ error: "Проблема с JWT: отсутствует параметр id" });
	}

	@Get("/")
	public async getCourses(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		let findConditions: { [k: string]: any } = {},
			sortConditions: { [k: string]: any } = {},
			lookup: { [k: string]: any }[] = [
				{
					from: "categories",
					localField: "categories",
					foreignField: "id",
					as: "categories"
				}
			],
			projection: { [k: string]: any } = {
				_id: 0,
				__v: 0,
				description: 0,
				reviews: 0,
				"categories._id": 0
			},
			params: { [k: string]: any } = {
				pageNumber: req.query.pageNumber,
				pageSize: req.query.pageSize,
				pagination: req.query.pagination
			};

		if (req.query.searchQuery) {
			const searchQuery = req.query.searchQuery.toString();
			findConditions["$text"] = { $search: searchQuery };
			projection.textScore = {
				$meta: "textScore"
			};
			params.searchQuery = searchQuery;
			sortConditions = { score: { $meta: "textScore" }, id: -1 };
		}

		if (
			req.query.sortViews &&
			!isNaN(parseInt(req.query.sortViews.toString()))
		) {
			const sortViews = parseInt(req.query.sortViews.toString());
			sortConditions = { countViews: sortViews, id: -1 };
		}

		if (req.query.categories) {
			findConditions["$or"] = [];
			const categories = req.query.categories.toString().split(",");
			params.categories = [];
			for (const categoryKey in categories) {
				const category = parseInt(categories[categoryKey]);
				if (!isNaN(category)) {
					params.categories.push(category);
					findConditions["$or"].push({ categories: category });
				}
			}
			params.categories = params.categories.join(",");
		}
		const dataObject = await this.getDocumentsWithPagination(
			params,
			findConditions,
			projection,
			sortConditions,
			lookup
		);
		return res.status(200).send(dataObject);
	}

	public async getDocumentsWithPagination(
		params: any,
		findConditions: any,
		projection: any,
		sortConditions: any = {},
		lookup: any = []
	) {
		if (params.pageSize) {
			params.pageNumber = isNaN(Number(params.pageNumber))
				? 1
				: Number(params.pageNumber);
			params.pageSize = Number(params.pageSize);
		} else {
			params.pageSize = 10;
			params.pageNumber = 1;
		}

		const options: any[] = [{ $match: findConditions }];

		if (lookup.length > 0) {
			for (const v of lookup) {
				options.push({ $lookup: v });
			}
		}
		if (Object.keys(sortConditions).length > 0) {
			options.push({ $sort: sortConditions });
		}
		if (Object.keys(projection).length > 0) {
			options.push({ $project: projection });
		}

		return await this.courseModel
			.find(findConditions)
			.countDocuments()
			.then((count) => {
				const currentPageNumber =
					params.pageNumber > 0 ? parseInt(params.pageNumber) : 1;
				params.pageSize =
					params.pageSize > 0 ? parseInt(params.pageSize) : 10;
				return this.courseModel
					.aggregate(options)
					.skip(
						currentPageNumber > 0
							? (currentPageNumber - 1) * params.pageSize
							: 0
					)
					.limit(params.pageSize)
					.then((data) => {
						const dataObject: { [k: string]: any } = {};
						if (params.pagination != "0") {
							delete params.pagination;
							if (count > params.pageNumber * params.pageSize) {
								params.pageNumber = currentPageNumber + 1;
								dataObject.nextPage =
									`/courses/?` + objectToQueryString(params);
							}
							const countPages = Math.floor(
								count >= 1
									? (count - 1) / params.pageSize + 1
									: 0
							);
							params.pageNumber = Math.min(
								currentPageNumber - 1,
								countPages
							);
							if (
								params.pageNumber > 0 &&
								params.pageNumber != currentPageNumber
							) {
								dataObject.previousPage =
									`/courses/?` + objectToQueryString(params);
							}
							dataObject.countPages = countPages;
						}
						dataObject.courses = data;

						return dataObject;
					});
			});
	}
}
