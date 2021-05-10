import { Request, Response } from "express";
import { Authorized, Body, Get, JsonController, Post, Req, Res } from "routing-controllers";
import { ICompilation, ICourse } from "../interfaces";
import { CompilationModel } from "../models";
import BaseController from "./BaseController";

@JsonController("/compilations")
export default class CompilationController extends BaseController<ICompilation> {

	constructor() {
		super();
	}

	@Get("/")
	public async getCompilations(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await CompilationModel.find({}, { _id: 0 }).then((compilations) => {
			return res.status(200).send(compilations);
		});
	}

	@Post("/")
	public async addCompilations(
		@Body({ required: true }) compilations: Array<ICompilation>,
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		if (req.body instanceof Array) {
			for (const compilationData of req.body) {
				await CompilationModel.updateOne(
					{ name: compilationData.name },
					{ $set: compilationData },
					{ upsert: true });
			}
			return res.status(201).send(compilations);
		} else {
			return res.status(400).send({ error: "Неправильный формат данных" });
		}
	}

}
