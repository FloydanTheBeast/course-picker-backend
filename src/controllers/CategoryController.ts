import { Request, Response } from "express";
import { Authorized, Body, Get, JsonController, Post, Req, Res } from "routing-controllers";
import { ICategory, ICourse, IUser } from "../interfaces";
import { CategoryModel } from "../models";
import BaseController from "./BaseController";
import Category, { ICategoryDocument } from "../models/category";

@JsonController("/categories")
export default class CategoryController extends BaseController<ICourse> {

	constructor() {
		super();
	}

	@Get("/")
	public async getCategories(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await CategoryModel.find({}, { _id: 0 }).then((categories) => {
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
				await Category.updateOne(
					{ id: categoryData.id },
					{ $set: categoryData },
					{ upsert: true });
			}
			return res.status(200).send(categories);
		} else {
			return res.status(400).send({ error: "Неправильный формат данных" });
		}
	}

}
