/* eslint-disable @typescript-eslint/no-explicit-any */
const colors = require("colors");

// FIXME: Проверять версию сборки
const isDev = true;

colors.enable();

class logger {
	static error(msg: any): void {
		colors.setTheme({
			info: ["bgRed", "black"],
			text: ["red"]
		});

		this.print(msg, "ERROR");
	}

	static warn(msg: any): void {
		colors.setTheme({
			info: ["bgYellow", "black"],
			text: ["yellow"]
		});

		this.print(msg, "WARNING");
	}

	static info(msg: any): void {
		colors.setTheme({
			info: ["bgBlue", "black"],
			text: ["blue"]
		});

		this.print(msg, "INFO");
	}

	static success(msg: any): void {
		colors.setTheme({
			info: ["bgGreen", "black"],
			text: ["green"]
		});

		this.print(msg, "SUCCESS");
	}

	private static print(msg: any, type: string): void {
		isDev &&
			// eslint-disable-next-line no-console
			console.log(
				colors.info(`[${new Date().toLocaleTimeString()}] ${type}:`) +
					" " +
					colors.text(msg)
			);
	}
}

export default logger;
