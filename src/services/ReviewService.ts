import { prepareOptionsByCourseId } from "../utils/courses";
import { ReviewModel } from "../models";

export class ReviewService {
	reviewModel = ReviewModel;

	aggregateByCourseId(courseId: string): Promise<any> {
		const options = prepareOptionsByCourseId(courseId);

		return this.reviewModel.aggregate(options);
	}
}
