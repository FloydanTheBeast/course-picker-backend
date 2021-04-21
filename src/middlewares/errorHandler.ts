import { Request, Response } from "express";
import {
	ExpressErrorMiddlewareInterface,
	Middleware
} from "routing-controllers";

@Middleware({ type: "after" })
export class HttpErrorHandler implements ExpressErrorMiddlewareInterface {
	error(
		error: Error,
		req: Request,
		res: Response,
		next: (err?: Error) => any
	): void {
		console.log(error);
		res.status(500).json({ error });
		next();
	}
}
