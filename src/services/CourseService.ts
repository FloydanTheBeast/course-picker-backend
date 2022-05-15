import { CourseModel } from "../models";

type MainPageCourses = { [k: string]: any };

export class CourseService {
	courseModel = CourseModel;

	async getMainPageCourses(): MainPageCourses {
		const findConditions: { [k: string]: any } = {},
			sortConditions: { [k: string]: any } = { countViews: -1 },
			lookup: { [k: string]: any }[] = [
				{
					from: "categories",
					localField: "categories",
					foreignField: "id",
					as: "categories"
				}
			],
			projection: { [k: string]: any } = {
				_id: 0,
				__v: 0,
				description: 0,
				reviews: 0,
				"categories._id": 0
			};

		const options: any[] = [{ $match: findConditions }];

		if (lookup.length > 0) {
			for (const v of lookup) {
				options.push({ $lookup: v });
			}
		}
		if (Object.keys(sortConditions).length > 0) {
			options.push({ $sort: sortConditions });
		}
		if (Object.keys(projection).length > 0) {
			options.push({ $project: projection });
		}

		const dataObject: MainPageCourses;

		dataObject.compilations = await CompilationModel.find(
			{},
			{ _id: 0 }
		).then((compilations) => compilations);

		dataObject.courses = await this.courseModel
			.find(findConditions)
			.countDocuments()
			.then((count) => {
				const limit = 12;
				return this.courseModel
					.aggregate(options)
					.limit(limit)
					.then((data) => data);
			});

		return dataObject;
	}
}
