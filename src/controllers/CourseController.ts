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
		let findConditions: { [k: string]: any } = {},
			sortConditions: { [k: string]: any } = {},
			projection: { [k: string]: any } = {
				_id: 0
			},
			params: { [k: string]: any } = {
				pageNumber: req.query.pageNumber,
				pageSize: req.query.pageSize
			};

		if (req.query.searchQuery) {
			const searchQuery = req.query.searchQuery.toString();
			findConditions = { $text: { $search: searchQuery } };
			projection.textScore = {
				$meta: "textScore"
			};
			params.searchQuery = searchQuery;
			sortConditions = { score: { $meta: "textScore" }, id: -1 };
		}

		const dataObject = await this.getDocumentsWithPagination(params, findConditions, projection, sortConditions);
		return res.status(200).send(dataObject);
	}

	public async getDocumentsWithPagination(params: any, findConditions: any, projection: any, sortConditions: any = {}) {
		if (params.pageSize) {
			params.pageNumber = isNaN(Number(params.pageNumber))
				? 1
				: Number(params.pageNumber);
			params.pageSize = Number(params.pageSize);
		} else {
			params.pageSize = 10;
			params.pageNumber = 1;
		}

		return await this.courseModel.find(findConditions).countDocuments().then((count) => {
			return this.courseModel
				.find(findConditions, projection)
				.sort(sortConditions)
				.skip(params.pageNumber > 0 ? (params.pageNumber - 1) * params.pageSize : 0)
				.limit(params.pageSize > 0 ? params.pageSize : 10)
				.then((data) => {
					const dataObject: { [k: string]: any } = {};

					if (count > params.pageNumber * params.pageSize) {
						params.pageNumber += 1;
						dataObject.nextPage = `/courses/?` + objectToQueryString(params);
					}
					dataObject.courses = data;

					return dataObject;
				});
		});
	}
}

function objectToQueryString(obj: any) {
	var str = [];
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
	}
	return str.join("&");
}