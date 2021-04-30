interface ICourse {
	id?: any;
	courseName: string;
	description: string;
	shortDescription: string;
	link: string;
	previewImageLink: string;
	vendor:  {
		id : string,
		name : string,
		icon : string
	}
	author: object;
	duration: string;
	price: { [k : string] : any};
	rating: {
		external: {
			averageScore : Number,
			countReviews: Number
		},
		internal: {
			averageScore : Number,
			countReviews: Number
		},
	};
	courseLanguages: string[];
	categories: number[];
}

export default ICourse;
