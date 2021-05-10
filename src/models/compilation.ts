import { Document, Model, model, Schema } from "mongoose";
import { ICompilation } from "../interfaces";

export interface ICompilationDocument extends ICompilation, Document {
}

export type ICompilationModel = Model<ICompilationDocument>;

const CompilationSchema = new Schema<ICompilationDocument>({
		icon: {
			type: String,
			required: true,
		},
		name: {
			type: Map,
			of: String
		},
		link: {
			type: String,
			required: true,
		},
	},
	{
		versionKey: false
	});

const Compilation = model<ICompilationDocument, ICompilationModel>("Compilation", CompilationSchema);

export default Compilation;
