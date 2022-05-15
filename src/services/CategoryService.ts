import { ICategory } from "../interfaces";
import { CategoryModel } from "../models";

export class CategoryService {
	categoryModel = CategoryModel;

	getAllCategories(): Promise<ICategoryDocument[]> {
		return this.categoryModel.find({}, { _id: 0 });
	}

	updateOne(categoryData: ICategory): Promise<ICategoryDocument> {
		return this.categoryModel.updateOne(
			{ id: categoryData.id },
			{ $set: categoryData },
			{ upsert: true }
		);
	}
}
