import ICourse from "./ICourse";

abstract class IParser {
	abstract parseCourses(): Promise<ICourse[]>;
	abstract parseCourses(saveToDB: boolean): Promise<ICourse[]>;
}

export default IParser;
