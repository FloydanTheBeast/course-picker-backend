import { ICourseDocument } from "../models/course";

abstract class IParser {
	abstract parseCourses(): Promise<ICourseDocument[]>;
	abstract parseCourses(saveToDB: boolean): Promise<ICourseDocument[]>;
}

export default IParser;
