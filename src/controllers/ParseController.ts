import { Request, Response } from "express";
import { Get, JsonController, Req, Res } from "routing-controllers";
import { ICourse } from "../interfaces";
import { CourseModel } from "../models";
import { openeduParser } from "../parsers/OpeneduParser";
import BaseController from "./BaseController";
import { udemyParser } from "../parsers/UdemyParser";
import { courseraParser } from "../parsers/CourseraParser";

const gc = require("expose-gc/function");

@JsonController("/parse")
export default class ParseController extends BaseController<ICourse> {
	courseModel = CourseModel;

	constructor() {
		super();
	}

	@Get("/courses/openedu")
	public async getOpeneduCourses(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await openeduParser.parseCourses(true).then((courses) => {
			return res.status(200).send(courses);
		});
	}

	@Get("/courses/udemy")
	public async getUdemyCourses(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await udemyParser.parseCourses(true).then((courses) => {
			return res.status(200).send(courses);
		});
	}

	@Get("/courses/coursera")
	public async getCourseraCourses(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await courseraParser.parseCourses(true).then((courses) => {
			return res.status(200).send("ok");
		});
	}
}
