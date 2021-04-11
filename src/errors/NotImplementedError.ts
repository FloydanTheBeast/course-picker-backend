import { HttpError } from "routing-controllers";

class NotImplementedError extends HttpError {
	name = "NotImplementedError";

	constructor(message?: string) {
		super(501);
		Object.setPrototypeOf(this, NotImplementedError.prototype);

		if (message) {
			this.message = message;
		}
	}
}

export default NotImplementedError;
