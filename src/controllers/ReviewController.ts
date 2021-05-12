import { Request, Response } from "express";
import { Authorized, Body, Delete, Get, JsonController, Post, Req, Res } from "routing-controllers";
import { ICategory, ICourse, IReview } from "../interfaces";
import { CourseModel, ReviewModel } from "../models";
import { openeduParser } from "../parsers/OpeneduParser";
import BaseController from "./BaseController";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { prepareOptionsByCourseId } from "../utils/courses";

const gc = require("expose-gc/function");


@JsonController("/reviews")
export default class ReviewController extends BaseController<IReview> {
	constructor() {
		super();
	}

	@Get("/")
	public async getReviewsByCourseId(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		if (req.query.id) {
			const courseId = req.query.id.toString();
			let options = prepareOptionsByCourseId(courseId);

			return await ReviewModel.aggregate(options)
				.then((reviews) => {
					return res.status(200).send({ courseId: courseId, reviews: reviews });
				});
		}
		return res.status(400).send({ error: "Отсутствует обязательный query-параметр 'courseId'" });
	}

	@Post("/")
	@Authorized()
	public async addReview(
		@Body({ required: true }) dataReview: { courseId: string, rating: number, text: string },
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
			if (req.query.id) {
				const review: IReview = {
					userId: _id,
					courseId: req.query.id.toString(),
					rating: dataReview.rating,
					text: dataReview.text
				};
				if (review.rating >= 1 && review.rating <= 5) {
					review.text = review.text.trim();
					if (review.text.length > 0) {
						return await ReviewModel.findOne({
							userId: review.userId,
							courseId: review.courseId
						})
							.then((existingReview) => {
									return CourseModel.findOne({ id: review.courseId })
										.then((course) => {

											if (course) {
												if (existingReview) {
													return ReviewModel.updateOne(
														{
															userId: review.userId,
															courseId: review.courseId
														}, { $set: review })
														.then(() => {
															const averageScore = Number(course.rating.internal.averageScore),
																countReviews = Number(course.rating.internal.countReviews);
															course.rating.internal.averageScore = (averageScore * countReviews + Number(review.rating) - Number(existingReview.rating)) / (countReviews);

															return CourseModel.updateOne({ id: review.courseId },
																{ $set: { "rating.internal": course.rating.internal } })
																.then(() => res.status(201).send());
														});
												} else {
													return ReviewModel.insertMany([review]).then(() => {
														const averageScore = Number(course.rating.internal.averageScore),
															countReviews = Number(course.rating.internal.countReviews);
														course.rating.internal.averageScore = (averageScore * countReviews + Number(review.rating)) / (countReviews + 1);
														course.rating.internal.countReviews = countReviews + 1;
														return CourseModel.updateOne({ id: review.courseId },
															{ $set: { "rating.internal": course.rating.internal } })
															.then(() => res.status(201).send({status : "ok"}));
													});
												}
											}
											return res.status(404).send({ error: "Не существует курса с переданным 'id'" });
										});
								}
							);
					}
					return res.status(400).send({ error: "Свойство 'text' не должно быть пустым" });
				}
				return res.status(400).send({ error: "Свойство 'rating' должно быть целым в отрезке [1, 5]" });
			}
			return res.status(400).send({ error: "Неправильный формат данных. Не представлен параметр 'id'" });
		}
		return res.status(400).send({ error: "Проблема с JWT: отсутствует параметр id" });
	}

	@Delete("/")
	@Authorized()
	public async deleteReview(
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
			if (req.query.reviewId) {
				const userId = _id,
					reviewId = req.query.reviewId.toString();

				return await ReviewModel.findOne({ _id: reviewId })
					.then((review) => {
							if (review) {
								if (review.userId == userId) {
									const rating = review.rating;
									return CourseModel.findOne({ id: review.courseId })
										.then((course) => {
											if (course) {
												return ReviewModel.deleteOne({ _id: reviewId }).then(() => {
													const averageScore = Number(course.rating.internal.averageScore),
														countReviews = Number(course.rating.internal.countReviews);
													course.rating.internal.averageScore = countReviews > 1 ?
														(averageScore * countReviews - Number(rating)) / (countReviews - 1) : 0;
													course.rating.internal.countReviews = countReviews - 1;

													return CourseModel.updateOne({ id: review.courseId },
														{ $set: { "rating.internal": course.rating.internal } })
														.then(() => res.status(200).send());
												});
											}
											return res.status(404).send({ error: "Не существует курса на который оставлен отзыв" });

										});
								}
								return res.status(400).send({ error: "Нельзя удалить чужой отзыв" });
							}
							return res.status(200).send();
						}
					);
			}
			return res.status(400).send({ error: "Неправильный формат данных. Не представлен параметр 'id'" });
		}
		return res.status(400).send({ error: "Проблема с JWT: отсутствует параметр id" });
	}

}
