import { Request, Response } from "express";
import { Get, JsonController, Req, Res } from "routing-controllers";
import { ICourse } from "../interfaces";
import { CourseModel } from "../models";
import BaseController from "./BaseController";

const gc = require("expose-gc/function");

@JsonController("/courses")
export default class CourseController extends BaseController<ICourse> {
	courseModel = CourseModel;

	constructor() {
		super();
	}

	@Get("/")
	public async getCourses(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		if (req.query.pageSize) {
			const pageNumber = isNaN(Number(req.query.pageNumber))
					? 1
					: Number(req.query.pageNumber),
				pageSize = Number(req.query.pageSize);
			return await this.courseModel.countDocuments().then((count) => {
				return this.courseModel
					.find({})
					.skip(pageNumber > 0 ? (pageNumber - 1) * pageSize : 0)
					.limit(pageSize > 0 ? pageSize : 10)
					.then((data) => {
						const nextPage = `/courses/?pageSize=${pageSize}&pageNumber=${
							pageNumber + 1
						}`;
						const dataObject: { [k: string]: any } = {};

						if (count > pageNumber * pageSize) {
							dataObject.nextPage = nextPage;
						}
						dataObject.courses = data;

						return res.status(200).send(dataObject);
					});
			});
		}

		return await this.courseModel.countDocuments().then((count) => {
			const limit = 10;
			return this.courseModel
				.find({})
				.limit(limit)
				.then((data) => {
					const nextPage = `/courses/?pageSize=${limit}&pageNumber=2`;
					const dataObject: { [k: string]: any } = {};

					if (count > 10) {
						dataObject.nextPage = nextPage;
					}
					dataObject.courses = data;

					return res.status(200).send(dataObject);
				});
		});
	}
}
