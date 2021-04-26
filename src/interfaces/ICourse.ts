interface ICourse {
	id?: any;
	courseName: string;
	description: string;
	shortDescription: string;
	link: string;
	previewImageLink: string;
	vendor: string;
	author: object;
	duration: string;
	price: { [k : string] : any};
	courseLanguages: string[];
	categories: number[];
}

export default ICourse;
