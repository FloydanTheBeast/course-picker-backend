import { Document, Model, model, Schema } from "mongoose";
import { IFilter } from "../interfaces";

export interface IFilterDocument extends IFilter, Document {
}

export type IFilterModel = Model<IFilterDocument>;

const FilterSchema = new Schema<IFilterDocument>({
		id: {
			type: String,
			unique: true,
			required: true
		},
		options: {
			type: Array
		},
		name: {
			type: Map,
			of: String
		},
		nativeName: {
			type: String
		}
	},
	{
		versionKey: false
	});

const Filter = model<IFilterDocument, IFilterModel>("Filter", FilterSchema);

export default Filter;
