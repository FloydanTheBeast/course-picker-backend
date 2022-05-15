import { IFilterDocument } from "src/models/filter";
import { FilterModel } from "../models";

export class FilterService {
	filterModel = FilterModel;

	getAllFilters(): Promise<IFilterDocument[]> {
		return this.filterModel.find({}, { _id: 0 });
	}
}
