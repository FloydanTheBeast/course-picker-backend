import { Request, Response } from "express";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import logger from "../utils/logger";

@Middleware({ type: "before" })
export class PreLoggingMiddleware implements ExpressMiddlewareInterface {
	use(req: Request, res: Response, next: (err?: any) => any): any {
		logger.info(req.url);
		next();
	}
}

@Middleware({ type: "after" })
export class PostLoggingMiddleware implements ExpressMiddlewareInterface {
	use(req: Request, res: Response, next: (err?: any) => any): any {
		if (res.statusCode === 200) {
			logger.success(res.statusMessage);
		} else {
			logger.warn(res.statusMessage);
		}

		next();
	}
}
