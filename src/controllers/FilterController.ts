import { Request, Response } from "express";
import {
	Authorized,
	Body,
	Get,
	JsonController,
	Post,
	Req,
	Res
} from "routing-controllers";
import { FilterService } from "../services/FilterService";
import { IFilter } from "../interfaces";
import { FilterModel } from "../models";
import BaseController from "./BaseController";

@JsonController("/filters")
export default class FilterController extends BaseController<IFilter> {
	filterService: FilterService;

	constructor() {
		super();
		this.filterService = new FilterService();
	}

	@Get("/")
	public async getFilters(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await this.filterService.getAllFilters().then((filters) => {
			return res.status(200).send(filters);
		});
	}
}
