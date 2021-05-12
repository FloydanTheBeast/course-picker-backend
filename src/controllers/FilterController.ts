import { Request, Response } from "express";
import { Authorized, Body, Get, JsonController, Post, Req, Res } from "routing-controllers";
import { IFilter } from "../interfaces";
import { FilterModel } from "../models";
import BaseController from "./BaseController";

@JsonController("/filters")
export default class FilterController extends BaseController<IFilter> {

	constructor() {
		super();
	}

	@Get("/")
	public async getFilters(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await FilterModel.find({}, { _id: 0 }).then((filters) => {
			return res.status(200).send(filters);
		});
	}

}
