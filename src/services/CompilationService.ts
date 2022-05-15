import { ICompilationDocument } from "../models/compilation";
import { CompilationModel } from "../models";

export class CompilationService {
	compilationModel = CompilationModel;

	getAllCompilations(): Promise<ICompilationDocument> {
		return this.compilationModel.find({}, { _id: 0 });
	}

	updateOne(compilationData: ICompilation): Promise<ICompilationDocument> {
		return this.compilationModel.updateOne(
			{ name: compilationData.name },
			{ $set: compilationData },
			{ upsert: true }
		);
	}
}
