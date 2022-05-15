import { Request, Response } from "express";
import { Body, Get, JsonController, Post, Req, Res } from "routing-controllers";
import { ICategory, ICourse } from "../interfaces";
import { CategoryService } from "../services/CategoryService";
import BaseController from "./BaseController";

@JsonController("/categories")
export default class CategoryController extends BaseController<ICourse> {
	categoryService: CategoryService;

	constructor() {
		super();
		this.categoryService = new CategoryService();
	}

	@Get("/")
	public async getCategories(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await this.categoryService
			.getAllCategories()
			.then((categories) => {
				return res.status(200).send(categories);
			});
	}

	@Post("/")
	public async addCategories(
		@Body({ required: true }) categories: Array<ICategory>,
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		if (req.body instanceof Array) {
			for (const categoryData of req.body) {
				await this.categoryService.updateOne(categoryData);
			}

			return res.status(200).send(categories);
		} else {
			return res
				.status(400)
				.send({ error: "Неправильный формат данных" });
		}
	}
}
