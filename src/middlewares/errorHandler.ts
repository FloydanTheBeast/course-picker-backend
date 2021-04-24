import { Request, Response } from "express";
import {
	ExpressErrorMiddlewareInterface,
	Middleware,
	UnauthorizedError
} from "routing-controllers";
import logger from "../utils/logger";

@Middleware({ type: "after" })
export class HttpErrorHandler implements ExpressErrorMiddlewareInterface {
	error(
		error: Error,
		req: Request,
		res: Response,
		next: (err?: Error) => any
	): void {
		logger.error(error);

		if (error instanceof UnauthorizedError) {
			res.status(401).json({
				error: "Необходима авторизация"
			});

			return;
		}

		res.status(500).jsonp(error);
		next();
	}
}
