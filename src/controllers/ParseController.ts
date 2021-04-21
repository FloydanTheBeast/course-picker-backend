import {Request, Response} from "express";
import {CourseModel} from "../models";
import cheerio from 'cheerio';
import {
	Body,
	HeaderParam,
	JsonController,
	Get,
	Req,
	Res
} from "routing-controllers";
import {ICourse} from "../interfaces";
import BaseController from "./BaseController";
import {get} from "../utils/request"
import {ICourseDocument, ICourseModel} from "../models/course";
import {openeduParser} from "../parsers/OpeneduParser";

const gc = require('expose-gc/function');

@JsonController("/parse")
export default class ParseController extends BaseController<ICourse> {
	courseModel = CourseModel;

	constructor() {
		super();
	}

	@Get("/courses/openedu")
	public async getCourses(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await openeduParser.parseCourses(true)
			.then(courses => {
					return res
						.status(200)
						.send(courses);
				}
			);
	}
}