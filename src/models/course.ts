import {Document, Model, model, Schema} from "mongoose";
import {ICourse} from "../interfaces";


export interface ICourseDocument extends ICourse, Document {

}

export type ICourseModel = Model<ICourseDocument>;

const CourseSchema = new Schema<ICourseDocument>({
	id: {
		type: String,
		unique: true,
		required: true
	},
	courseName: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	shortDescription: {
		type: String,
		required: true
	},
	link: {
		type: String,
		required: true
	},
	previewImageLink: {
		type: String,
		required: true
	},
	vendor: {
		type: String,
		required: true
	},
	author: {
		type: {
			name: String,
			link: String,
			icon: String,
		},
	},
	duration: {
		type: String,
		required: true
	},
	courseLanguages: {
		type: [String],
		required: true
	},
	creationDate: {
		type: Date,
		default: Date.now
	},
	groups: {
		type: {
			title: String,
			code: String,
		},
	},
	price: {
		type: Number,
		required: true
	},
});

CourseSchema.pre("save", function (next) {
	const course = this;
	Course.findOne({id: course.id}).then((existingCourse) => {
		if (existingCourse == null)
			return next();
		else
			Course.findOneAndDelete({id: course.id}).then(() => next());
	})

});

const Course = model<ICourseDocument, ICourseModel>("Course", CourseSchema);

export default Course;