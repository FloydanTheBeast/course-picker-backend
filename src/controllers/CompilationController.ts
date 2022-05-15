import { Request, Response } from "express";
import { Body, Get, JsonController, Post, Req, Res } from "routing-controllers";
import { CompilationService } from "../services/CompilationService";
import { ICompilation } from "../interfaces";
import { CompilationModel } from "../models";
import BaseController from "./BaseController";

@JsonController("/compilations")
export default class CompilationController extends BaseController<ICompilation> {
	compilationService: CompilationService;

	constructor() {
		super();
		this.compilationService = new CompilationService();
	}

	@Get("/")
	public async getCompilations(
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		return await this.compilationService.getAllCompilations.then(
			(compilations) => {
				return res.status(200).send(compilations);
			}
		);
	}

	@Post("/")
	public async addCompilations(
		@Body({ required: true }) compilations: Array<ICompilation>,
		@Req() req: Request,
		@Res() res: Response
	): Promise<any | Response> {
		if (req.body instanceof Array) {
			for (const compilationData of req.body) {
				await this.compilationService.updateOne(compilationData);
			}
			return res.status(201).send(compilations);
		} else {
			return res
				.status(400)
				.send({ error: "Неправильный формат данных" });
		}
	}
}
