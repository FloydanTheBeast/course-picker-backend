import { Request, Response } from "express";
import { Delete, Get, Post, Put } from "routing-controllers";
import { NotImplementedError } from "../errors";
import { IUser } from "../interfaces/";

abstract class BaseController<T> {
	@Post()
	public async create(
		userData: IUser,
		req?: Request,
		res?: Response
	): Promise<any> {
		throw new NotImplementedError();
	}

	@Get()
	public read(): T | void {
		throw new NotImplementedError();
	}

	@Put()
	public update(): T | void {
		throw new NotImplementedError();
	}

	@Delete()
	public delete(): T | void {
		throw new NotImplementedError();
	}
}

export default BaseController;
