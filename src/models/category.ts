import { Document, Model, model, Schema } from "mongoose";
import { ICategory } from "../interfaces";

export interface ICategoryDocument extends ICategory, Document {
}

export type ICategoryModel = Model<ICategoryDocument>;

const CategorySchema = new Schema<ICategoryDocument>({
		id: {
			type: Number,
			unique: true,
			required: true
		},
		name: {
			type: Map,
			of: String
		}
	},
	{
		versionKey: false
	});

const Category = model<ICategoryDocument, ICategoryModel>("Category", CategorySchema);

export default Category;
