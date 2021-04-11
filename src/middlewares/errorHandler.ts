import { Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";
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
		if (error instanceof TokenExpiredError) {
			res.json({ err: error.name, refreshToken: "test" });
		} else {
			res.json({ err: error.name });
		}
		next();
	}
}
