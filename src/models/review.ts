import { Document, Model, model, Schema } from "mongoose";
import { IReview } from "../interfaces";

export interface IReviewDocument extends IReview, Document {
}

export type IReviewModel = Model<IReviewDocument>;

const ReviewSchema = new Schema<IReviewDocument>({
		courseId: {
			type: String,
			required: true,
		},
		userId: {
			type: String,
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		rating: {
			type: Number,
			required: true,
		},
		creationDate: {
			type: Date,
			default: Date.now
		}
	},
	{
		versionKey: false
	});

const Review = model<IReviewDocument, IReviewModel>("Review", ReviewSchema);

export default Review;
