export function prepareOptionsByCourseId(courseId : string) {
	let findConditions: { [k: string]: any } = { courseId: courseId },
		projection: { [k: string]: any } = {
			id: "$_id",
			rating: 1,
			text: 1,
			creationDate: 1,
			user: 1
		};


	let options: any[] = [{ $match: findConditions }];

	options.push({
		$lookup: {
			from: "users",
			localField: "userId",
			foreignField: "_id",
			as: "user"
		}
	});
	options.push({
		$lookup: {
			from: "users",
			let: { "userId": "$userId" },
			pipeline: [
				{
					$project: {
						objectUserId: { "$toObjectId": "$$userId" },
						username: 1
					}
				},
				{
					$match: { $expr: { $eq: ["$_id", "$objectUserId"] } }
				},
				{
					$project: {
						_id: 0,
						objectUserId: 0
					}
				}
			],
			as: "user"
		}
	});
	options.push({
		$unwind: {
			path: "$user",
			preserveNullAndEmptyArrays: true
		}
	});
	if (Object.keys(projection).length > 0) {
		options.push({ $project: projection });
	}
	options.push({
		$project: {
			_id: 0
		}
	});
	return options;
}